<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar';
  import * as Avatar from '$lib/components/ui/avatar';
  import { Hand, UserIcon } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import CollapsibleSection from './collapsible.svelte';
  import UserListItem from './conv.svelte';
  import { Button } from '../ui/button';
  import { presence } from '$live/presence';
  import type { joinStream } from '../../../live/join';
  import { formatLastSeen } from '$lib/utils';

  const {
    joins,
    gotoJoin,
    user
  }: {
    joins: joinStream;
    gotoJoin: () => void;
    user: { id: string };
  } = $props();

  let presenceData = $state<Record<string, any[]>>({});

  $effect(() => {
    const currentJoins = joins;
    if (!currentJoins) return;

    const unsubs = currentJoins.map((j) => {
      const store = presence(j.convId);
      return store.subscribe((value) => {
        untrack(() => {
          const deduped = [...new Map((value ?? []).map((p: any) => [p.key, p])).values()];
          presenceData[j.convId] = deduped;
          presenceData = { ...presenceData };
        });
      });
    });

    return () => {
      for (const fn of unsubs) fn();
    };
  });

  let personals = $derived(joins.filter((join) => join.type == 'personal'));
  let channels = $derived(joins.filter((join) => join.type == 'channel'));
  let groups = $derived(joins.filter((join) => join.type == 'group'));
</script>

<Sidebar.Content class="gap-0">
  {#if personals.length}
    <CollapsibleSection title="Personal">
      {#each personals as personal (personal.convId)}
        {@const onlineUsers = presenceData[personal.convId] ?? []}
        {@const otherOnline = onlineUsers.some((p: any) => p.key !== user.id)}
        <Sidebar.MenuButton class="h-fit">
          {#snippet child({ props })}
            <UserListItem
              href={personal.convId}
              {...props}
              {...personal.info}
              convType="personal"
              isOnline={otherOnline}
              status={personal.lastMessage ??
                (otherOnline ? 'Online' : formatLastSeen(personal.peerLastSeen))}
            />
          {/snippet}
        </Sidebar.MenuButton>
      {/each}
    </CollapsibleSection>
  {/if}

  {#if channels.length}
    <CollapsibleSection title="Channels">
      {#each channels as ch (ch.convId)}
        {@const count = (presenceData[ch.convId] ?? []).length}
        <Sidebar.MenuButton class="h-fit">
          {#snippet child({ props })}
            <UserListItem
              href={ch.convId}
              {...props}
              {...ch.info}
              convType="channel"
              status={ch.lastMessage}
            />
          {/snippet}
        </Sidebar.MenuButton>
      {/each}
    </CollapsibleSection>
  {/if}

  {#if groups.length}
    <CollapsibleSection title="Groups">
      {#each groups as grp (grp.convId)}
        {@const count = (presenceData[grp.convId] ?? []).length}
        <Sidebar.MenuButton class="h-fit">
          {#snippet child({ props })}
            <UserListItem
              href={grp.convId}
              {...props}
              {...grp.info}
              convType="group"
              onlineCount={count}
              status={grp.lastMessage}
            />
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
