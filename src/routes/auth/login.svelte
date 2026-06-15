<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import { PenIcon } from '@lucide/svelte';
  import * as Tabs from '$lib/components/ui/tabs';
  import ToggleTheme from '$lib/components/toggle-theme.svelte';
  import { signIn } from './auth.remote.ts';
</script>

<Tabs.Content value="login">
  <Card.Root class="w-screen max-w-sm">
    <Card.Header>
      <Card.CardTitle>Login</Card.CardTitle>
      <Card.Description
        >Enter required informations in order to access to your account</Card.Description
      >
      <Card.Action>
        <ToggleTheme />
      </Card.Action>
    </Card.Header>
    <Card.Content>
      <form {...signIn}>
        <Field.Set>
          <Field.Group>
            <Field.Field>
              <Field.Label>Username</Field.Label>
              <Input placeholder="sohrab" {...signIn.fields.username.as('text')} />
            </Field.Field>
            <Field.Field>
              <Field.Label>Password</Field.Label>
              <Input placeholder="••••••••" {...signIn.fields.password.as('password')} />
            </Field.Field>
            <Field.Separator />
            <Field.Field orientation="responsive">
              <Button type="submit">
                <PenIcon /> Sign in
              </Button>
              <Field.Description>
                with sign in you are accepting the term of service that does not exist
                <span class="text-destructive">{signIn.fields.allIssues()?.[0] ?? ''}</span>
              </Field.Description>
            </Field.Field>
          </Field.Group>
        </Field.Set>
      </form>
    </Card.Content>
    <Card.Footer></Card.Footer>
  </Card.Root>
</Tabs.Content>
