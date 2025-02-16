<script lang="ts">
  import { onMount, getContext } from "svelte";
  import { evalES } from "../../lib/utils/bolt";
  import { getPresetFile } from "../../api/SQPreset";
  import { v4 as uuidv4 } from "uuid";
  import { fs } from "../../lib/cep/node";
  import Dropdown from "../../components/Dropdown/Dropdown.svelte";
  import DropdownItem from "../../components/Dropdown/DropdownItem.svelte";
  const appId: string = getContext("appId");

  const resolutions = [
    { label: "2880x2880", value: "2880x2880" },
    { label: "1920x1080", value: "1920x1080" },
    { label: "1080x1920", value: "1080x1920" },
    { label: "1920x1920", value: "1920x1920" },
    { label: "1080x1080", value: "1080x1080" },
    { label: "1350x1080", value: "1350x1080" },
  ];

  interface Template {
    label: string;
    value: string;
    apps: string[];
  }

  const templateList = [
    { label: "Shot", value: "Shot", apps: ["AEFT"] },
    { label: "Edit", value: "Edit", apps: ["AEFT", "PPRO"] },
    { label: "Conform", value: "Conform", apps: ["PPRO"] },
  ];

  $: getTemplates = () => {
    if (appId) {
      return templateList.filter((t) => {
        return t.apps.includes(appId);
      });
    }
    return [templateList[0]];
  };

  $: templates = getTemplates();
  $: console.log(templates);

  const framerates = [
    { label: "23.976", value: "23.976" },
    { label: "24", value: "24" },
    { label: "25", value: "25" },
    { label: "29.97", value: "29.97" },
    { label: "30", value: "30" },
    { label: "59.94", value: "59.94" },
  ];

  let sequenceName = "Master";
  let framerate = "24";
  let resolution = "1920x1080";
  let duration = 240;
  let template = templateList[1].value;

  $: aeTemplatePath = `/buck/globalprefs/SHARED/AFTER_EFFECTS/templates/default${template}Template.aep`;
  $: pproTemplatePath = `/buck/globalprefs/SHARED/PREMIERE/templates/default${template}Template.prproj`;

  const handleStartProject = async () => {
    const [width, height] = resolution.split("x");
    const option = {
      width,
      height,
      framerate: framerate,
    };

    if (appId === "PPRO") {
      const sqp = await getPresetFile(
        option.width,
        option.height,
        option.framerate
      );
      if (sqp) {
        const sequenceOptions = {
          sequenceName: sequenceName,
          templatePath: pproTemplatePath,
          presetPath: sqp,
          uuid: uuidv4(),
        };

        await evalES(
          `newSequenceFromPreset(${JSON.stringify(sequenceOptions)})`,
          false
        );
        fs.unlinkSync(sqp);
      }
    } else if (appId === "AEFT") {
      const aeOptions = {
        presetPath: aeTemplatePath,
        width: parseInt(option.width),
        height: parseInt(option.height),
        framerate: parseFloat(option.framerate),
        duration: duration,
        name: sequenceName,
      };
      await evalES(
        `newSequenceFromPreset(${JSON.stringify(aeOptions)})`,
        false
      );
    }
  };

  const handleFramerateChange = (value: string) => {
    // const target = event.target as HTMLSelectElement;
    framerate = value;
  };

  const handleResolutionChange = (value: string) => {
    resolution = value;
  };

  const handleTemplateChange = (value: string) => {
    // const target = event.target as HTMLSelectElement;
    template = value;
  };

  const handleSequenceNameChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    sequenceName = target.value;
  };

  const handleDurationChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    duration = parseInt(target.value);
  };

  $: console.log(framerate, resolution, sequenceName);

  onMount(async () => {});
</script>

<div style="display:flex; flex-direction:column; text-align:center">
  {#if appId === "AEFT"}
    <div class="flex-row-start">
      <Dropdown
        defaultValue="Shot"
        placeholder={template ?? "Select Template"}
        label="Template"
        onSelected={handleTemplateChange}
      >
        {#each templates as template}
          <DropdownItem value={template.value}>
            {template.label}
          </DropdownItem>
        {/each}
      </Dropdown>
    </div>
  {/if}
  {#if template === "Shot" || appId === "PPRO"}
    <div class="flex-row-start">
      <Dropdown
        defaultValue="1920x1080"
        placeholder={resolution ?? "Select Resolution"}
        label="Resolutions"
        onSelected={handleResolutionChange}
      >
        {#each resolutions as resolution}
          <DropdownItem value={resolution.value}>
            {resolution.label}
          </DropdownItem>
        {/each}
      </Dropdown>
    </div>
    <div class="flex-row-start">
      <Dropdown
        defaultValue="24"
        placeholder={framerate ?? "Select Framerate"}
        label="Framerate"
        onSelected={handleFramerateChange}
      >
        {#each framerates as framerate}
          <DropdownItem value={framerate.value}>
            {framerate.label}
          </DropdownItem>
        {/each}
      </Dropdown>
    </div>
  {/if}
  {#if template === "Shot" && appId === "AEFT"}
    <div class="flex-row-start">
      <label for="duration">Duration (in frames): </label>
      <input
        type="number"
        placeholder="240"
        bind:value={duration}
        on:change={handleDurationChange}
      />
    </div>
  {/if}

  <div class="flex-row-start">
    <label for="sequenceName"
      >{appId === "AEFT" ? "Composition " : "Sequence "}Name:
    </label>
    <input
      type="text"
      placeholder="master"
      bind:value={sequenceName}
      style="flex-grow:1;"
      on:change={handleSequenceNameChange}
    />
  </div>

  <div class="flex-row-end">
    <button class="active" on:click={handleStartProject}>Start Project</button>
  </div>
</div>
