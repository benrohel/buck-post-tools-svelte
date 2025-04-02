<script lang="ts">
  import { getContext } from 'svelte';
  
  import NukeToAe from './NukeToAE.svelte';
  import {getScriptsList} from '../../api/scripts/tools-scripts';

  import ToolCard from '../../components/ClipCard/ToolCard.svelte';
  
 interface ToolData {
  name: string;
  version: string;
  description: string;
  filepath: string;
  author?: string;
  icon?: string;
  apps?: string[];
}

  interface ToolItem {
    [key: string]: ToolData;
  }
  import toolList from "./tools.json";
  const tools  = toolList as ToolItem;



  const appId = getContext('appId') as string;

  console.log(getScriptsList(appId));

  $: toolArray = ()=> {return Object.keys(tools).filter((t)=>{return tools[t].apps.includes(appId)}).map((k)=>{
      return {value: tools[k], label: k}
    })};
  

    $:console.log(toolArray())

  interface SelectToolItem {
    value: string;
    label: string;
    component: any;
    apps: string[];
  }


  const renameModes = [
    {
      value: 'nukeToAe',
      label: 'Import Nuke Corner Pin',
      apps: ['AEFT'],
      component: NukeToAe,
    },
  ];

 
 
</script>

<div>
  {#each toolArray() as tool}
   <ToolCard scripTool={tool.value}/>
  {/each}

</div>