<script>
  import { beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import AppSidebar from '$lib/components/sidebar/sidebar.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { joinStream } from '$live/join';
  const { user } = page.data;
</script>

<div
  class="fixed top-0 right-0 bottom-0 left-0 opacity-10 dark:invert"
  style="background-image:url(/backgrounds/1.svg)"
></div>

<Sidebar.Provider>
  <AppSidebar collapsible="none" {user} joins={$joinStream} />
  <main class="flex w-full grow items-center justify-center">
    <h1 class="text-4xl">Welcome to kabotar</h1>
  </main>
</Sidebar.Provider>
