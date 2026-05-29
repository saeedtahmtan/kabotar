<script lang="ts">
  import { page } from '$app/state';
  import Viewport from '$lib/components/chat/viewport.svelte';
  import Header from '$lib/components/app/header.svelte';
  import Sidebar from '$lib/components/sidebar/sidebar.svelte';
  import Input from '$lib/components/chat/input.svelte';
  import { Provider } from '$lib/components/ui/sidebar';
  import { msgStream, msgDelete, msgSend } from '$live/chat';
  import { fade } from 'svelte/transition';
  import { joinStream } from '$live/join';
  import { beforeNavigate } from '$app/navigation';
  import { binaryEncode as b } from '$lib/utils';
  // TODO need to be typed correctly

  const conv = $derived(page.params.conv);
  const streamStore = $derived(msgStream(conv));
  let hasMore = $state(false);
  $effect(() => {
    $streamStore;
    hasMore = streamStore.hasMore;
  });
  let sidebarOpen = $state(false);
  const [selectedJoin] = $derived(
    $joinStream?.filter((join: any) => join.convId == conv) || { title: '', image: '' }
  );

  async function doSend(input: string, files: ArrayBuffer[]) {
    if (!conv) return;
    const buffer = b([
      { data: conv, struct: 'string' },
      { data: input, struct: 'string' },
      {
        data: b(
          files.map((b) => ({
            data: b,
            struct: 'buffer'
          }))
        ),
        struct: 'buffer'
      }
    ]);

    await msgSend(buffer);
  }
  function doDelete(id: string) {
    if (conv) msgDelete(conv, id);
  }

  function getConnectionState() {
    if ($streamStore == undefined) return 'Updating ...';
    return 'online';
  }

  const { user } = page.data;
  beforeNavigate(() => {
    sidebarOpen = false;
  });
</script>

<div
  class="fixed top-0 right-0 bottom-0 left-0 opacity-10 dark:invert"
  style="background-image:url(/backgrounds/1.svg)"
></div>
<Provider bind:openMobile={sidebarOpen}>
  <Sidebar {user} joins={$joinStream} />

  <div class="relative mx-auto flex grow flex-col sm:p-2" transition:fade>
    <Header
      state={getConnectionState()}
      {...selectedJoin?.info}
      type={selectedJoin?.type ?? 'save'}
    />
    <Viewport
      messages={$streamStore}
      sender={user.id}
      {hasMore}
      onDelete={doDelete}
      onLoadMore={() => streamStore.loadMore()}
    />
    <footer class="mx-auto flex w-full max-w-3xl p-2 pt-0">
      <Input onSubmit={doSend} />
    </footer>
  </div>
</Provider>
