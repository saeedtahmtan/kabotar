<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar';
  import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
  import * as Avatar from '$lib/components/ui/avatar';
  import { Hand, UserIcon } from '@lucide/svelte';
  import CollapsibleSection from './collapsible.svelte';
  import UserListItem from './conv.svelte';
  import { Button } from '../ui/button';
  import type { joinStream } from '../../../live/join';

  const {
    joins,
    gotoJoin
  }: {
    joins: joinStream;
    gotoJoin: () => void;
  } = $props();
  let personal = $derived(joins.filter((join) => join.type == 'personal'));
</script>

<Sidebar.Content class="gap-0">
  <!-- <Sidebar.Group> -->
  <!--   <Sidebar.GroupContent> -->
  <!--     <ScrollArea orientation="horizontal"> -->
  <!--       <div class="flex gap-4 px-4"> -->
  <!--         <Avatar.Root> -->
  <!--           <Avatar.Image src={'/cool.png'} /> -->
  <!--           <Avatar.Fallback class="rounded-lg"> -->
  <!--             <UserIcon /> -->
  <!--           </Avatar.Fallback> -->
  <!--         </Avatar.Root> -->
  <!--       </div> -->
  <!--     </ScrollArea> -->
  <!--   </Sidebar.GroupContent> -->
  <!-- </Sidebar.Group> -->

  {#if personal.length}
    <CollapsibleSection title="Personal">
      {#each joins as join}
        <Sidebar.MenuButton class="h-fit">
          {#snippet child({ props })}
            <UserListItem href={join.convId} {...props} {...join.info} />
          {/snippet}
        </Sidebar.MenuButton>
      {/each}
    </CollapsibleSection>
  {/if}

  {#if !joins.length}
    <div
      class="flex h-full w-full flex-col items-center justify-center gap-4 text-muted-foreground"
    >
      <Hand class="animate-bounce" />
      Try joining new conversation
      <Button onclick={gotoJoin}>Join</Button>
    </div>
  {/if}
</Sidebar.Content>
