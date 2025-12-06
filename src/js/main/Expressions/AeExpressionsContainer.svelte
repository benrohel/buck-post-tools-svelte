<script lang="ts">
  // import { SaveUserProfile, GetUserProfile } from '@/api/preferences';
  import ExpressionCard from './ExpressionCard.svelte';
  import { evalES } from '@/lib/utils/bolt';
  import { onMount } from 'svelte';
  import { GetExpressions } from '@/api/coda/coda-web';
  import ModalCode from './ModalCode.svelte';
  import { flip } from 'svelte/animate';
  import { appStore } from '@/stores/app-store';
  import { localAppStore } from '@/stores/local-storage';
  import { Star, Download, FileCode } from 'lucide-svelte';
  import { SyncLoader } from 'svelte-loading-spinners';
  import { Tooltip } from '@svelte-plugins/tooltips';

  const nullExpression: ExpressionSnippet = {
    id: 'null',
    values: {
      Name: 'Custom',
      Expression: '',
      Variables: [],
      Creator: '',
      Description: '',
    },
  };
  let isLoading = false;
  $: showCode = false;
  $: expressionFilter = '';
  let selectedExpressionId = 'xx';
  let selectedExpression: ExpressionSnippet = nullExpression;
  let allExpressions: ExpressionSnippet[] = [];
  $: filterFavorites = false;

  const handleFilterChange = async (v: any) => {
    expressionFilter = v.target.value;
    filteredExpressions = getExpressions();
  };

  const handleFilterFavorites = () => {
    filterFavorites = !filterFavorites;
    filteredExpressions = getExpressions();
  };

  const handleSelectExpresison = (e: ExpressionSnippet) => {
    if (selectedExpressionId == e.id) {
      selectedExpressionId = '';
      selectedExpression = nullExpression;
    } else {
      selectedExpression = e;
      selectedExpressionId = e.id;
    }
  };

  const handleExpresionsUpdate = (e: string) => {
    const updatedIndex = allExpressions.findIndex((exp) => {
      return exp.id === e;
    });
    const updatedExpression = allExpressions[updatedIndex];
    updatedExpression.favorite = !updatedExpression.favorite;
    const newExpressions = [...allExpressions];
    newExpressions[updatedIndex] = updatedExpression;
    allExpressions = newExpressions;
    $appStore.favoriteExpressions = allExpressions
      .filter((exp) => exp.favorite)
      .map((exp) => exp.id);
    console.log('appStore', $appStore);
    localAppStore.set($appStore);
  };

  const getExpressions = (): ExpressionSnippet[] => {
    let res = allExpressions;
    if (expressionFilter || filterFavorites) {
      res = allExpressions.filter((t: ExpressionSnippet) => {
        return (
          t.values.Name.toLocaleLowerCase().match(
            expressionFilter.toLocaleLowerCase()
          ) ||
          t.values.Property?.toLocaleLowerCase().match(
            expressionFilter.toLowerCase()
          )
        );
      });

      if (filterFavorites) {
        res = res.filter((exp: ExpressionSnippet) => {
          return $appStore.favoriteExpressions.includes(exp.id);
        });
      }
      return res.sort();
    } else {
      return allExpressions;
    }
  };

  $: filteredExpressions = getExpressions();

  const openModal = () => {
    if (showCode) {
      showCode = false;
    } else {
      showCode = true;
    }
    console.log(showCode);
  };

  const setExpression = async () => {
    const reg = new RegExp(/```/, 'g');
    let formattedExpression = selectedExpression.values.Expression.replace(
      reg,
      ''
    );
    formattedExpression = formattedExpression.replace('\n', '');
    console.log(JSON.stringify(formattedExpression));
    evalES(
      `applyExpressionToSelectedProperty(${JSON.stringify(
        formattedExpression
      )})`,
      false
    );
  };

  const setExpressionFromEditor = (exp: string) => {
    evalES(`applyExpressionToSelectedProperty(${JSON.stringify(exp)})`, false);
  };

  const setAllExpressions = () => {
    isLoading = true;
    //https://coda.io/d/AE-Cheatsheet_dTFoJxLBvGS/Expressions_sufOz#_luChY

    console.log($appStore.favoriteExpressions);

    GetExpressions('TFoJxLBvGS', 'grid-ZqgRS-DMmt').then(
      (r: ExpressionSnippet[]) => {
        if (r) {
          if ($appStore.favoriteExpressions) {
            const storedFavorites = $appStore.favoriteExpressions;
            allExpressions = r.map((exp: ExpressionSnippet) => {
              const fav = storedFavorites.find((item: string) => {
                return item === exp.id;
              });
              return { ...exp, favorite: fav ? true : false };
            });
          } else {
            allExpressions = r.map((exp: ExpressionSnippet) => {
              return { ...exp, favorite: false };
            });
          }
        } else {
          allExpressions = [];
        }
        filteredExpressions = allExpressions;
        isLoading = false;
      }
    );
  };
  onMount(() => {
    setAllExpressions();
  });
</script>

<div class="container">
  <div class="row" style="width:100%; justify-content:space-between">
    <div id="filter-row">
      <label style="padding-left:0px" for="name">Filter</label>
      <input
        type="text"
        bind:value={expressionFilter}
        on:change={handleFilterChange}
      />
      <div
        style={`color:#1473e6`}
        id="fav-icon"
        on:click={handleFilterFavorites}
      >
        {#if filterFavorites}
          <Star fill="#086ce7" />
        {:else}
          <Star />
        {/if}
      </div>
    </div>
    <div class="icons-grp">
      <Tooltip
        action={$appStore.showTooltips ? 'hover' : 'none'}
        content="Open Expression Code"
        position="left"
        delay={1000}
      >
        <button class="active" on:click={openModal}>
          <FileCode />
        </button>
      </Tooltip>
      <Tooltip
        action={$appStore.showTooltips ? 'hover' : 'none'}
        content="Apply Expression"
        position="left"
        delay={1000}
      >
        <button
          class="active"
          on:click={setExpression}
          disabled={!selectedExpression}
        >
          <Download />
        </button>
      </Tooltip>
    </div>
  </div>
  <div class="tasks-container">
    {#if isLoading}
      <SyncLoader color="#adadad" size="20" />
    {:else if filteredExpressions && !isLoading}
      {#each filteredExpressions as exp, id (exp.id)}
        <div
          style="width:100%"
          animate:flip={{ duration: (d) => 40 * Math.sqrt(d) }}
        >
          <ExpressionCard
            expression={exp}
            onSelect={handleSelectExpresison}
            onUpdate={handleExpresionsUpdate}
            {id}
            selected={selectedExpressionId === exp.id}
          />
        </div>
      {/each}
    {/if}
    {#if showCode}
      <ModalCode
        onClose={() => (showCode = false)}
        onApplyCode={setExpressionFromEditor}
        expression={selectedExpression}
      />
    {/if}
  </div>
</div>

<style lang="scss">
  .tasks-container {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    align-content: center;
    justify-content: flex-start;
    height: calc(100vh - 110px);
    width: 100%;
    overflow-y: scroll;
    margin-top: 8px;
    gap: 8px;
  }
  .container {
    width: 100%;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
  }

  #filter-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .icons-grp {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: 8px;
  }
  #fav-icon {
    width: 22px;
    height: 22px;
  }
  #fav-icon:hover {
    cursor: pointer;
  }
</style>
