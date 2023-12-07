<script lang="ts">
  export let comment: any;
  export let onCommentClick: Function = () => {};
  let isSelectable = () => {
    return comment.data.frameIn;
  };
  $: selectable = isSelectable();

  const goToFrame = () => {
    if (onCommentClick && comment.data.frameIn) {
      onCommentClick(comment.data.frameIn);
    }
  };
</script>

<div
  on:click={goToFrame}
  on:keydown={goToFrame}
  class={selectable ? "comment-container selectable" : "comment-container"}
>
  {#if !comment.data.type}
    <h4 class="frame-label">GLOBAL</h4>
    <div class="comment-content">
      {comment.data.content}
    </div>
  {:else}
    <h4 class="frame-label">
      <div class="comment-content">
        {comment.data.frameIn} - {comment.data.frameOut}
      </div>
    </h4>
    {#if comment.data.type == "annotation"}
      <div class="comment-content">
        {comment.data.content}
      </div>
    {:else}
      drawing note
    {/if}
  {/if}
</div>

<style lang="scss">
  @import "../../variables.scss";

  h4 {
    margin: 2px;
  }
  .comment-container {
    font-size: small;
    margin-left: 8px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    // width: 100%;
    gap: 8px;
    line-height: 20px;
    padding: 2px;
    white-space: pre-line;
  }
  .selectable :hover {
    cursor: pointer;
  }

  .frame-label {
    color: $active;
    width: 50px;
  }
  .comment-content {
    text-align: start;
  }
</style>
