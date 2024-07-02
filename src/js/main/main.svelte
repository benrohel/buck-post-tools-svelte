<script lang="ts">
  import { onMount } from "svelte";
  import { os, path } from "../lib/cep/node";
  import {
    csi,
    evalES,
    evalFile,
    openLinkInBrowser,
    subscribeBackgroundColor,
    evalTS,
  } from "../lib/utils/bolt";
  import "../index.scss";
  import { configureFetcher } from "buck5-javascript-client";
  import Tabs from "../components/Tabs/Tabs.svelte";
  import {
    ArrowDownUp,
    PencilRuler,
    WrapText,
    ArrowRightFromLine,
  } from "lucide-svelte";
  import ProjectContainer from "./Project/ProjectContainer.svelte";
  import RenameContainer from "./Rename/RenameContainer.svelte";
  import IngestContainer from "./Ingest/IngestContainer.svelte";
  import ExportContainer from "./Export/ExportContainer.svelte";
  import Footer from "./Footer.svelte";
  import Toast from "../components/Toast/Toast.svelte";

  let count: number = 0;
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
  ];

  //* Demonstration of Traditional string eval-based ExtendScript Interaction
  const jsxTest = () => {
    console.log(evalES(`helloWorld("${csi.getApplicationID()}")`));
  };

  //* Demonstration of End-to-End Type-safe ExtendScript Interaction
  const jsxTestTS = () => {
    evalTS("helloStr", "test").then((res) => {
      console.log(res);
    });
    evalTS("helloNum", 1000).then((res) => {
      console.log(typeof res, res);
    });
    evalTS("helloArrayStr", ["ddddd", "aaaaaa", "zzzzzzz"]).then((res) => {
      console.log(typeof res, res);
    });
    evalTS("helloObj", { height: 90, width: 100 }).then((res) => {
      console.log(typeof res, res);
      console.log(res.x);
      console.log(res.y);
    });
    evalTS("helloVoid").then(() => {
      console.log("function returning void complete");
    });
    evalTS("helloError", "test").catch((e) => {
      console.log("there was an error", e);
    });
  };

  const nodeTest = () => {
    alert(
      `Node.js ${process.version}\nPlatform: ${
        os.platform
      }\nFolder: ${path.basename(window.cep_node.global.__dirname)}`
    );
  };

  onMount(async () => {
    if (window.cep) {
      subscribeBackgroundColor((c: string) => (backgroundColor = c));
      await configureFetcher(); // this is a one time call
    }
  });
</script>

<div class="app" style="background-color: {backgroundColor};">
  <Tabs {items} />
  <Toast />
  <Footer />
</div>

<style>
  .app {
  }
</style>
