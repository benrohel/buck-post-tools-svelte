<script lang="ts">
  import { onMount } from "svelte";
  import { subscribeBackgroundColor } from "../lib/utils/bolt";
  import "../index.scss";
  import Tabs from "../components/Tabs/Tabs.svelte";
  import { getAuthAuthenticated, client } from "buck-client";
  import {
    ArrowDownUp,
    PencilRuler,
    WrapText,
    ArrowRightFromLine,
  } from "lucide-svelte";
  import { connectToDaemon } from "./backend";
  import ProjectContainer from "./Project/ProjectContainer.svelte";
  import RenameContainer from "./Rename/RenameContainer.svelte";
  import IngestContainer from "./Ingest/IngestContainer.svelte";
  import ExportContainer from "./Export/ExportContainer.svelte";
  // import SettingsContainer from './Settings/SettingsContainer.svelte';
  import Footer from "./Footer.svelte";
  import Toast from "../components/Toast/Toast.svelte";

  $: authenticated = false;
  let backgroundColor: string = "#282c34";

  let items = [
    {
      label: "Tools",
      value: 1,
      component: ProjectContainer,
      icon: PencilRuler,
    },
    { label: "Rename", value: 2, component: RenameContainer, icon: WrapText },
    {
      label: "Ingest",
      value: 3,
      component: IngestContainer,
      icon: ArrowDownUp,
    },
    {
      label: "Export",
      value: 4,
      component: ExportContainer,
      icon: ArrowRightFromLine,
    },
    // {
    //   label: 'Settings',
    //   value: 5,
    //   component: SettingsContainer,
    //   icon: Settings,
    // },
  ];

  onMount(async () => {
    if (window.cep) {
      subscribeBackgroundColor((c: string) => (backgroundColor = c));

      await connectToDaemon();
      if (client) {
        authenticated = (await getAuthAuthenticated()).data.user ? true : false;
      }
    }
  });
</script>

<div class="app" style="background-color: {backgroundColor};">
  <Tabs {items} />
  <Toast />
  <Footer {authenticated} />
</div>

<style>
</style>
