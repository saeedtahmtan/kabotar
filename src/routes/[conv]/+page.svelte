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
  import { presence } from '$live/presence';
  import { status as wsStatus } from 'svelte-adapter-uws/client';
  import { beforeNavigate } from '$app/navigation';
  import { binaryEncode as b } from '$lib/utils';
  // TODO need to be typed correctly

  const conv = $derived(page.params.conv ?? '');
  const streamStore = $derived(msgStream(conv));
  const convPresence = $derived(presence(conv));
  let hasMore = $state(false);
  $effect(() => {
    $streamStore;
    hasMore = streamStore.hasMore;
  });
  let sidebarOpen = $state(false);
  const [selectedJoin] = $derived(
    $joinStream?.filter((join: any) => join.convId == conv) ?? []
  );
  const onlineCount = $derived(
    selectedJoin ? [...new Map(($convPresence ?? []).map((p: any) => [p.key, p])).values()].length : 0
  );
  const headerState = $derived.by(() => {
    if ($wsStatus !== 'open') return 'Reconnecting...';
    if ($streamStore == null) return 'Updating ...';
    if (!selectedJoin) return 'Your safe vault';
    if (selectedJoin.type === 'personal') {
      const otherOnline = $convPresence?.some((p: any) => p.key !== user.id);
      if (otherOnline) return 'Online';
      const lastSeen = (selectedJoin as any)?.peerLastSeen;
      if (lastSeen) return formatLastSeen(new Date(lastSeen));
      return 'Offline';
    }
    return `${onlineCount} online`;
  });

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

  const { user } = page.data;
  beforeNavigate(() => {
    sidebarOpen = false;
  });

  function formatLastSeen(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
</script>

<div
  class="fixed top-0 right-0 bottom-0 left-0 opacity-10 dark:invert"
  style="background-image:url(/backgrounds/1.svg)"
></div>
<Provider bind:openMobile={sidebarOpen}>
  <Sidebar {user} joins={$joinStream} />

  <div class="relative mx-auto flex grow flex-col sm:p-2" transition:fade>
    <Header
      state={headerState}
      title={selectedJoin?.info?.title ?? 'Saved Messages'}
      image={selectedJoin?.info?.image}
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
