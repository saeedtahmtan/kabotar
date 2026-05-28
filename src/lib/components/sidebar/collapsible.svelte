<script lang="ts">
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { cn } from '$lib/utils';
  import { ChevronRightIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  let {
    title,
    open = true,
    children
  }: {
    title: string;
    open?: boolean;
    children: Snippet;
  } = $props();
</script>

<Collapsible.Root {open} class="group/collapsible">
  <Sidebar.Group class="py-0">
    <Sidebar.GroupLabel
      class="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      {#snippet child({ props })}
        <Collapsible.Trigger {...props} class={cn(props.class ?? '', 'text-muted-foreground')}>
          {title}
          <ChevronRightIcon
            class="ms-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
          />
        </Collapsible.Trigger>
      {/snippet}
    </Sidebar.GroupLabel>
    <Collapsible.Content>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {@render children()}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Collapsible.Content>
  </Sidebar.Group>
</Collapsible.Root>
