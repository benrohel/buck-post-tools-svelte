function getProjectSelection() {
    const viewIDs = app.getProjectViewIDs();
    const viewSelection = app.getProjectViewSelection(viewIDs[0]);
    return viewSelection;
}
/**
 * Creates a new sequence for each selected clip in the Project panel.
 * @param {string} [startTimecode="00:00:00:00"] - Start timecode for all created sequences.
 * @param {string} [binName=""] - Optional bin name to place sequences in. Uses root if empty.
 */
export function createSequencePerClip(startTimecode: string, binName: string) {
    startTimecode = startTimecode || "01:00:00:00";

    var proj = app.project;
    var rootBin = proj.rootItem;

    // --- Resolve destination bin ---
    var destBin = rootBin;
    if (binName && binName.length > 0) {
        destBin = findOrCreateBin(rootBin, binName);
    }

    // --- Gather selected project items ---
    var selectedItems = getProjectSelection();

    if (selectedItems.length === 0) {
        return ("ERROR: No clips selected in the Project panel.");
    }

    app.enableQE(); // Required for sequence start timecode manipulation

    var created: string[] = [];
    var skipped: string[] = [];

    for (var i = 0; i < selectedItems.length; i++) {
        var item = selectedItems[i];

        // Skip bins, sequences, and other non-clip types
        if (item.type !== ProjectItemType.CLIP) {
            skipped.push(item.name);
            continue;
        }

        var clipName = item.name;
        // Strip extension for cleaner sequence name
        var lastDot = clipName.lastIndexOf(".");
        var seqName = lastDot !== -1 ? clipName.slice(0, lastDot) : clipName;


        // Create sequence matching the clip's settings
        var seq = proj.createNewSequenceFromClips(seqName, [item], destBin);

        if (!seq) {
            skipped.push(clipName + " (sequence creation failed)");
            continue;
        }

        // --- Set start timecode via QE ---
        setSequenceStartTimecode(seq, startTimecode);

        created.push(seqName);
    }

    // --- Report ---
    var msg = "SUCCESS: Created " + created.length + " sequence(s).";
    if (skipped.length > 0) {
        msg += "\n\nSkipped (" + skipped.length + "):\n- " + skipped.join("\n- ");
    }
    return msg;
}


function getNominalTimecodeBase(videoDisplayFormat) {
    switch (videoDisplayFormat) {
        case 100: return 24; // 24 Timecode
        case 101: return 25; // 25 Timecode
        case 102: return 30; // 29.97 Drop
        case 103: return 30; // 29.97 Non-Drop
        case 104: return 30; // 30 Timecode
        case 105: return 50; // 50 Timecode
        case 106: return 60; // 59.94 Drop
        case 107: return 60; // 59.94 Non-Drop
        case 108: return 60; // 60 Timecode
        case 110: return 24; // 23.976 Timecode
        case 113: return 48; // 48 Timecode
        default:
            throw new Error("Unsupported videoDisplayFormat: " + videoDisplayFormat);
    }
}

function timecodeToFramesNDF(tc: string, tcBase: number) {
    var p = tc.split(":");
    if (p.length !== 4) {
        throw new Error("Invalid timecode. Expected HH:MM:SS:FF");
    }

    var hh = parseInt(p[0], 10);
    var mm = parseInt(p[1], 10);
    var ss = parseInt(p[2], 10);
    var ff = parseInt(p[3], 10);

    return (((hh * 60) + mm) * 60 + ss) * tcBase + ff;
}

function setSequenceZeroPointFromTimecode(sequence: Sequence, tc: string) {
    var tcBase = getNominalTimecodeBase(sequence.videoDisplayFormat);
    var ticksPerFrame = parseInt(sequence.timebase, 10);

    var totalFrames = timecodeToFramesNDF(tc, tcBase);
    var ticks = String(totalFrames * ticksPerFrame);

    return sequence.setZeroPoint(ticks);
}



/**
 * Sets the start timecode of a sequence using the QE DOM.
 * @param {Sequence} sequence
 * @param {string} tc - e.g. "01:00:00:00"
 */
function setSequenceStartTimecode(sequence: any, tc: string) {
    var tcBase = getNominalTimecodeBase(sequence.videoDisplayFormat);
    var ticksPerFrame = parseInt(sequence.timebase, 10);

    var totalFrames = timecodeToFramesNDF(tc, tcBase);
    var ticks = String(totalFrames * ticksPerFrame);

    return sequence.setZeroPoint(ticks);
}
