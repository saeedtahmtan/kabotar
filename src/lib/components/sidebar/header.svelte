<script lang="ts">
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Button } from '$lib/components/ui/button';
  import ToggleTheme from '$lib/components/toggle-theme.svelte';
  import { MenuIcon, SearchIcon, SettingsIcon, PlayIcon, Bookmark } from '@lucide/svelte';

  const {
    title = 'Kabotar',
    user
  }: {
    title?: string;
    user: { username: string };
  } = $props();
</script>

<div class="flex items-center gap-2">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="ghost" size="icon">
          <MenuIcon />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-67 bg-background/70 backdrop-blur-sm">
      <DropdownMenu.Label class="flex">
        <span class="grow text-lg">Menu</span>
        <ToggleTheme variant="ghost" />
      </DropdownMenu.Label>
      <DropdownMenu.Item>
        <Bookmark />
        <a href={`/${user.username}`}>Saved message</a>
        <DropdownMenu.Shortcut></DropdownMenu.Shortcut>
      </DropdownMenu.Item>
      <DropdownMenu.Item>
        <SettingsIcon />
        Setting
        <DropdownMenu.Shortcut>Ctrl+,</DropdownMenu.Shortcut>
      </DropdownMenu.Item>
      <DropdownMenu.Item>
        <PlayIcon class="opacity-0" />
        Version
        <DropdownMenu.Shortcut>v0.0.1 alpha</DropdownMenu.Shortcut>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  <div class="grow">{title}</div>
  <Button variant="ghost" size="icon">
    <SearchIcon />
  </Button>
</div>
