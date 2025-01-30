<script lang="ts">
  import { trackerType } from '../../stores/local-storage';
  import { loggedIn } from '../../stores/aquarium-store';
  import IngestCodaContainer from './IngestCodaContainer.svelte';
  import IngestAquariumContainer from './IngestAquariumContainer.svelte';
</script>

{#if $trackerType === 'coda'}
  <IngestCodaContainer />
{:else if $trackerType === 'aquarium' && $loggedIn}
  <IngestAquariumContainer />
{:else}
  <p>Tracker type not found</p>
{/if}
