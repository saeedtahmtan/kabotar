<script lang="ts">
  import { HashIcon, Radio, Users } from '@lucide/svelte';
  import Button, { buttonVariants } from '../ui/button/button.svelte';
  import * as Sidebar from '../ui/sidebar';
  import * as Dialog from '../ui/dialog';
  import { Switch } from '../ui/switch';
  import { Label } from '../ui/label';
  import { cn } from '$lib/utils';
  import { Input } from '../ui/input';
  import { joinCreate, channelCreate, groupCreate } from '$live/join';

  let joinTarget = $state('');

  let channelName = $state('');
  let channelPublic = $state(true);
  let channelIdentifier = $state('');

  let groupName = $state('');
  let groupPublic = $state(true);
  let groupIdentifier = $state('');

  const { gotoMain }: { gotoMain: () => void } = $props();

  function join() {
    joinCreate(joinTarget).then(() => {
      gotoMain();
    });
  }

  async function createChannel() {
    if (!channelName) return;
    await channelCreate(channelName, channelPublic ? channelIdentifier : undefined);
    gotoMain();
  }

  async function createGroup() {
    if (!groupName) return;
    await groupCreate(groupName, groupPublic ? groupIdentifier : undefined);
    gotoMain();
  }
</script>

<Sidebar.Content class="flex flex-col gap-1 p-1">
  <Sidebar.Group>
    <Dialog.Root>
      <Dialog.Trigger
        type="button"
        class={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}
      >
        <Radio /> Create new channel
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create channel</Dialog.Title>
          <Dialog.Description>Create a new channel to broadcast messages.</Dialog.Description>
        </Dialog.Header>

        <div class="flex flex-col gap-4 sm:px-2">
          <div class="flex flex-col gap-2">
            <Label for="channel-name">Name</Label>
            <Input id="channel-name" placeholder="channel name" bind:value={channelName} />
          </div>
          <div class="flex items-center gap-2">
            <Switch id="channel-public" bind:checked={channelPublic} />
            <Label for="channel-public">Public</Label>
          </div>
          {#if channelPublic}
            <div class="flex flex-col gap-2">
              <Label for="channel-identifier">Identifier</Label>
              <Input
                id="channel-identifier"
                placeholder="channel-id"
                bind:value={channelIdentifier}
              />
            </div>
          {/if}
        </div>

        <Dialog.Footer>
          <Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Close</Dialog.Close>
          <Button
            onclick={createChannel}
            disabled={channelName.length == 0 || (channelPublic && channelIdentifier.length == 0)}
            >Create</Button
          >
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>

    <Dialog.Root>
      <Dialog.Trigger
        type="button"
        class={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}
      >
        <Users /> Create new group
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create group</Dialog.Title>
          <Dialog.Description>Create a new group for collaboration.</Dialog.Description>
        </Dialog.Header>

        <div class="flex flex-col gap-4 sm:px-2">
          <div class="flex flex-col gap-2">
            <Label for="group-name">Name</Label>
            <Input id="group-name" placeholder="group name" bind:value={groupName} />
          </div>
          <div class="flex items-center gap-2">
            <Switch id="group-public" bind:checked={groupPublic} />
            <Label for="group-public">Public</Label>
          </div>
          {#if groupPublic}
            <div class="flex flex-col gap-2">
              <Label for="group-identifier">Identifier</Label>
              <Input id="group-identifier" placeholder="group-id" bind:value={groupIdentifier} />
            </div>
          {/if}
        </div>

        <Dialog.Footer>
          <Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Close</Dialog.Close>
          <Button
            onclick={createGroup}
            disabled={groupName.length == 0 || (groupPublic && groupIdentifier.length == 0)}
            >Create</Button
          >
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>

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
            Enter a public channel/group identifier or a username to find a conversation.
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
