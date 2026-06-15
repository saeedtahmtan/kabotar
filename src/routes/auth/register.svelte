<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import { PenIcon } from '@lucide/svelte';
  import * as Tabs from '$lib/components/ui/tabs';
  import ToggleTheme from '$lib/components/toggle-theme.svelte';
  import { signUp } from './auth.remote.ts';
</script>

<Tabs.Content value="register">
  <Card.Root class="w-screen max-w-sm">
    <Card.Header>
      <Card.CardTitle>Sign Up</Card.CardTitle>
      <Card.Description>Enter your credential to sign up in to your account</Card.Description>
      <Card.Action>
        <ToggleTheme />
      </Card.Action>
    </Card.Header>
    <Card.Content>
      <form {...signUp}>
        <Field.Set>
          <Field.Group>
            <Field.Field>
              <Field.Label>Username</Field.Label>
              <Input placeholder="sohrab" {...signUp.fields.username.as('text')} />
            </Field.Field>
            <Field.Field>
              <Field.Label>Name</Field.Label>
              <Input placeholder="Sohrab Tahmtan" {...signUp.fields.name.as('text')} />
            </Field.Field>
            <Field.Field>
              <Field.Label>Password</Field.Label>
              <Input placeholder="••••••••" {...signUp.fields.password.as('password')} />
            </Field.Field>
            <Field.Separator />
            <Field.Field orientation="responsive">
              <Button type="submit">
                <PenIcon /> Sign up
              </Button>
              <Field.Description>
                with sign up you are accepting the term of service that does not exist
                <span class="text-destructive">{signUp.fields.allIssues()?.[0] ?? ''}</span>
              </Field.Description>
            </Field.Field>
          </Field.Group>
        </Field.Set>
      </form>
    </Card.Content>
    <Card.Footer></Card.Footer>
  </Card.Root>
</Tabs.Content>
