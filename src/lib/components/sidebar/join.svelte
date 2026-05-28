<script lang="ts">
  import { HashIcon, Radio, Users } from '@lucide/svelte';
  import Button, { buttonVariants } from '../ui/button/button.svelte';
  import * as Sidebar from '../ui/sidebar';
  import * as Dialog from '../ui/dialog';
  import { cn } from '$lib/utils';
  import { Input } from '../ui/input';
  import { joinCreate } from '$live/join';

  let joinTarget = $state('');

  const { gotoMain }: { gotoMain: () => void } = $props();
  function join() {
    joinCreate(joinTarget).then(() => {
      gotoMain();
    });
  }
</script>

<Sidebar.Content class="flex flex-col gap-1 p-1">
  <Sidebar.Group>
    <Button variant="ghost" class="justify-start"><Radio /> Create new channel</Button>
    <Button variant="ghost" class="justify-start"><Users /> Create new group</Button>
    <Dialog.Root>
      <Dialog.Trigger
        type="button"
        class={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}
      >
        <HashIcon /> Join with identifier
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Enter the identifier</Dialog.Title>
          <Dialog.Description>
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </Dialog.Description>
        </Dialog.Header>

        <Input placeholder="rostam" bind:value={joinTarget} />

        <Dialog.Footer class="">
          <Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Close</Dialog.Close>
          <Button onclick={join} disabled={joinTarget.length == 0}>Join</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  </Sidebar.Group>
  <Sidebar.Group>
    <Sidebar.GroupLabel>Your contacts</Sidebar.GroupLabel>
  </Sidebar.Group>
</Sidebar.Content>
