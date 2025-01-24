<script lang="ts">
  import { trackerType } from "../../stores/settings-store";
  import IngestCodaContainer from "./IngestCodaContainer.svelte";
  import IngestAquariumContainer from "./IngestAquariumContainer.svelte";
</script>

{#if $trackerType === "coda"}
  <IngestCodaContainer />
{:else if $trackerType === "aquarium"}
  <IngestAquariumContainer />
{:else}
  <p>Tracker type not found</p>
{/if}
