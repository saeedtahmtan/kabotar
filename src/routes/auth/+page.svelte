<script>
  import * as Tabs from '$lib/components/ui/tabs';
  import Register from './register.svelte';
  import Login from './login.svelte';
  import { BirdIcon } from '@lucide/svelte';


</script>

<div class="flex h-screen w-screen flex-col items-center justify-center gap-5">
  <BirdIcon size={64} />
  <h1 class="text-2xl">Welcome to the kabotar</h1>
  <Tabs.Root value="login">
    <Tabs.List>
      <Tabs.Trigger value="login">Login</Tabs.Trigger>
      <Tabs.Trigger value="register">Register</Tabs.Trigger>
    </Tabs.List>
    <Login />
    <Register />
  </Tabs.Root>
</div>
