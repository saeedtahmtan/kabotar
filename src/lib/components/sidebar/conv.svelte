<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar';
  import { UserIcon } from '@lucide/svelte';
  import { page } from '$app/state';
  import { nFormat } from '$lib/utils';

  let {
    href,
    image,
    title,
    status = '',
    isOnline = false,
    onlineCount,
    convType
  }: {
    href: string;
    image: string | null;
    title: string;
    status?: string | null;
    isOnline?: boolean;
    onlineCount?: number;
    convType?: string;
  } = $props();
</script>

<a
  {href}
  class="group flex items-center gap-3 rounded-xl p-3 transition-colors data-[active=true]:bg-sidebar-accent"
  data-active={page.url.pathname === `/${href}`}
>
  <div class="relative size-10 shrink-0">
    <Avatar.Root class="size-10">
      <Avatar.Image src={image} />
      <Avatar.Fallback class="rounded-lg">
        <UserIcon />
      </Avatar.Fallback>
    </Avatar.Root>
    {#if isOnline}
      <span
        class="absolute right-0 bottom-0 size-3 rounded-full border-2 border-sidebar bg-sidebar-primary"
      ></span>
    {/if}
    {#if convType === 'group' && onlineCount !== undefined && onlineCount > 0}
      <span class="absolute right-0 bottom-0 text-xs font-bold text-sidebar-primary"
        >{nFormat(onlineCount)}</span
      >
    {/if}
  </div>
  <div class="flex min-w-0 flex-col">
    <span class="truncate font-bold">{title}</span>
    <span class="truncate text-sm text-muted-foreground">
      {#if status}
        {status}
      {/if}
    </span>
  </div>
</a>
