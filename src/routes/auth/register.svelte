<script>
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import { PenIcon } from '@lucide/svelte';
  import * as Tabs from '$lib/components/ui/tabs';
  import ToggleTheme from '$lib/components/toggle-theme.svelte';
  import { enhance } from '$app/forms';
  const { form } = $props();
</script>

<Tabs.Content value="register">
  <Card.Root class="w-screen max-w-sm">
    <Card.Header>
      <Card.CardTitle>Sign Up</Card.CardTitle>
      <Card.Description>Enter your credential to sign in to your account</Card.Description>
      <Card.Action>
        <ToggleTheme />
      </Card.Action>
    </Card.Header>
    <Card.Content>
      <form method="POST" use:enhance>
        <Field.Set>
          <Field.Group>
            <!--Email-->
            <Field.Field>
              <Field.Label>Username</Field.Label>
              <Input placeholder="sohrab" name="username" />
            </Field.Field>
            <!--Name-->
            <Field.Field>
              <Field.Label>Name</Field.Label>
              <Input placeholder="Sohrab Tahmtan" name="name" />
            </Field.Field>
            <!--Password-->
            <Field.Field>
              <Field.Label>Password</Field.Label>
              <Input type="password" placeholder="••••••••" name="password" />
            </Field.Field>
            <Field.Separator />

            <Field.Field orientation="responsive">
              <Button type="submit" formaction="?/signUp">
                <PenIcon /> Sign in</Button
              >
              <Field.Description
                >with sign in you are accepting the term of service that does not exist
                <span class="text-destructive">{form?.message ?? ''}</span>
              </Field.Description>
            </Field.Field>
          </Field.Group>
        </Field.Set>
      </form>
    </Card.Content>
    <Card.Footer></Card.Footer>
  </Card.Root>
</Tabs.Content>
