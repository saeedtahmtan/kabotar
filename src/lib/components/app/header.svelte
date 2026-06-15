<script lang="ts">
  import { ArrowLeft, Bookmark, PanelLeft, PanelRight, UserIcon } from '@lucide/svelte';
  import * as Avatar from '$lib/components/ui/avatar';
  import SidebarTrigger from '$lib/components/ui/sidebar/sidebar-trigger.svelte';
  import { Skeleton } from '../ui/skeleton';

  const {
    image,
    title,
    type,
    state = 'waiting for network connection'
  }: { image?: string; title?: string; state: string; type: string } = $props();
</script>

<header
  class="flex items-center gap-2 border-b border-input bg-sidebar p-2 sm:rounded-2xl sm:border"
>
  <SidebarTrigger class="p-5">
    <PanelLeft class="hidden sm:block" />
    <ArrowLeft class="sm:hidden" />
  </SidebarTrigger>
  <Avatar.Root class="size-10">
    <Avatar.Image src={image} />
    <Avatar.Fallback class="rounded-lg">
      {#if type == 'save'}
        <Bookmark />
      {:else}
        <UserIcon />
      {/if}
    </Avatar.Fallback>
  </Avatar.Root>
  <div class="flex flex-col">
    <span class="text-base/tight font-bold">
      {#if title}
        {title}
      {:else if type == 'save'}
        Saved messages
      {:else}
        <Skeleton class="h-5 w-40" />
      {/if}
    </span>
    <span class="text-sm/3 text-muted-foreground">{state}</span>
  </div>
</header>
