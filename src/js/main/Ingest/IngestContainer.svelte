<script lang="ts">
  import { trackerType } from '../../stores/local-storage';
  import { loggedIn } from '../../stores/aquarium-store';
  import IngestCodaContainer from './IngestCodaContainer.svelte';
  import IngestAquariumContainer from './IngestAquariumContainer.svelte';
</script>

<IngestAquariumContainer />
