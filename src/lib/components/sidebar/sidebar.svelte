<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar';
  import SidebarHeader from './header.svelte';
  import Main from './main.svelte';
  import type { joinStream } from '../../../live/join';
  import Join from './join.svelte';
  import Button from '../ui/button/button.svelte';
  import { ArrowLeft, PenIcon } from '@lucide/svelte';
  let {
    collapsible = 'offcanvas',
    joins = [],
    user
  }: {
    joins?: joinStream;
    collapsible?: 'offcanvas' | 'icon' | 'none';
    user: { id: string; username: string };
  } = $props();

  let page = $state('main');

  function setPage(name: string) {
    return () => {
      page = name;
    };
  }
</script>

<Sidebar.Root {collapsible} variant="floating">
  {#if page === 'main'}
    <Sidebar.Header>
      <SidebarHeader title={'kabotar'} {user} />
    </Sidebar.Header>
    <Main {joins} {user} gotoJoin={setPage('join')} />
    <Sidebar.Footer class="items-end p-5">
      <Button onclick={setPage('join')} class="h-12 w-12 rounded-full"><PenIcon /></Button>
    </Sidebar.Footer>
  {/if}
  {#if page === 'join'}
    <Sidebar.Header>
      <SidebarHeader title={'Join'} {user} />
    </Sidebar.Header>
    <Join gotoMain={setPage('main')} />
    <Sidebar.Footer>
      <Button variant="ghost" onclick={setPage('main')}><ArrowLeft /> Exit</Button>
    </Sidebar.Footer>
  {/if}
</Sidebar.Root>
