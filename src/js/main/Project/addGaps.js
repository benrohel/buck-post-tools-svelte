// Add gaps between clips in the current timeline and fill with text of the next clip
function addGapsBetweenClips(gap) {
  app.enableQE();
  const newSeq = app.project.activeSequence;

  for (var t = 0; newSeq.videoTracks.numTracks; t++) {
    var currentTrack = newSeq.videoTracks[t];

    var numberOfClips = currentTrack.clips.numItems;
    var clips = currentTrack.clips;

    for (var c = numberOfClips - 1; c > 0; c--) {
      var newInTime = new Time();
      alert(String(newInTime.seconds));
      newInTime.seconds = gap * c;

      clips[c].move(newInTime);
    }
  }

  alert('Gaps added between clips.');
}

// Run the function
addGapsBetweenClips(1);
