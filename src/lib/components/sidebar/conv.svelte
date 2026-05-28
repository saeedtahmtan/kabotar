<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar';
  import { UserIcon } from '@lucide/svelte';
  import { page } from '$app/state';

  let {
    href,
    image,
    title,
    status = 'Hi! what is going on?'
  }: {
    href: string;
    image: string | null;
    title: string;
    status?: string;
  } = $props();
</script>

<a
  {href}
  class=" group flex items-center gap-3 rounded-xl p-3 transition-colors data-[active=true]:bg-sidebar-accent"
  data-active={page.url.pathname === `/${href}`}
>
  <Avatar.Root class="size-10">
    <Avatar.Image src={image} />
    <Avatar.Fallback class="rounded-lg">
      <UserIcon />
    </Avatar.Fallback>
  </Avatar.Root>
  <div class="flex flex-col">
    <span class="font-bold">{title}</span>
    <span class="text-sm text-muted-foreground">{status}</span>
  </div>
</a>
