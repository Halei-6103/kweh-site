import { supabase, type VoteRow } from '../lib/supabase';
import { byId } from './dom';

/**
 * Glamour of the Week ballot.
 * One vote per person per week (anonymous Supabase sign-in, so one per browser),
 * changeable until the week rolls over. Tallies update live for everyone.
 */
export async function setupVoting(nominees: string[], week: string): Promise<void> {
  const optsEl = byId('opts');
  const statusEl = byId('voteStatus');

  let tallies = new Map<string, number>();
  let myPick: string | null = null;
  let myId: string | null = null;
  let busy = false;

  const status = (msg: string) => (statusEl.textContent = msg);

  function render(): void {
    const total = [...tallies.values()].reduce((a, b) => a + b, 0);
    optsEl.replaceChildren(
      ...nominees.map((name, i) => {
        const count = tallies.get(name) ?? 0;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = `vote-${i}`;
        btn.className = 'opt' + (name === myPick ? ' mine' : '');
        btn.disabled = !myId || busy;

        const bar = document.createElement('span');
        bar.className = 'bar';
        bar.style.width = total ? `${(count / total) * 100}%` : '0';
        const nm = document.createElement('span');
        nm.className = 'nm';
        nm.textContent = name;
        const ct = document.createElement('span');
        ct.className = 'ct';
        ct.textContent = `${count} ${count === 1 ? 'vote' : 'votes'}`;

        btn.append(bar, nm, ct);
        btn.addEventListener('click', () => void cast(name));
        return btn;
      }),
    );
  }

  render();

  if (!supabase) {
    status('Voting is not connected yet. Add your Supabase keys to .env (see README).');
    return;
  }
  const db = supabase;

  async function refresh(): Promise<void> {
    const { data, error } = await db.from('votes').select('user_id, pick').eq('week', week);
    if (error) {
      status('Could not load the tallies. Reload to try again.');
      return;
    }
    const next = new Map<string, number>();
    myPick = null;
    for (const row of (data ?? []) as Pick<VoteRow, 'user_id' | 'pick'>[]) {
      if (!nominees.includes(row.pick)) continue;
      next.set(row.pick, (next.get(row.pick) ?? 0) + 1);
      if (row.user_id === myId) myPick = row.pick;
    }
    tallies = next;
    render();
  }

  async function cast(name: string): Promise<void> {
    if (!myId || busy || name === myPick) return;
    busy = true;
    render();
    const { error } = await db
      .from('votes')
      .upsert({ user_id: myId, week, pick: name } satisfies VoteRow, { onConflict: 'user_id,week' });
    busy = false;
    if (error) {
      status('That vote did not save. Check your connection and try again.');
      render();
      return;
    }
    status(`Vote saved for ${name}. You can change it until Sunday night.`);
    await refresh();
  }

  // Reuse the browser's existing anonymous session, or start one.
  const { data: existing } = await db.auth.getSession();
  let session = existing.session;
  if (!session) {
    const { data, error } = await db.auth.signInAnonymously();
    if (error) {
      status('Voting sign-in failed. Turn on anonymous sign-ins in Supabase (see README).');
      await refresh();
      return;
    }
    session = data.session;
  }
  myId = session?.user.id ?? null;
  status('Pick one. You can change your vote until Sunday night.');
  await refresh();

  db.channel(`votes-${week}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `week=eq.${week}` }, () => {
      void refresh();
    })
    .subscribe();
}
