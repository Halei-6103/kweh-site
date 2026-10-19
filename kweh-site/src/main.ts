import './styles.css';
import { CONFIG, MEMBERS, featuredMember, nominees } from './config';
import { startHall } from './scene';
import { fillContent, setupCopyInvite } from './ui/content';
import { byId } from './ui/dom';
import { renderRoster } from './ui/roster';
import { setupVoting } from './ui/vote';

const featured = featuredMember();

fillContent(featured);
setupCopyInvite();
renderRoster(MEMBERS, featured);
void setupVoting(nominees(), CONFIG.week);

startHall({
  canvas: byId<HTMLCanvasElement>('scene'),
  featured,
  sections: [...document.querySelectorAll<HTMLElement>('main .sec')],
  navLinks: [...document.querySelectorAll<HTMLAnchorElement>('.nav a')],
});
