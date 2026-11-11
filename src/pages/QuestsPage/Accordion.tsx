import { useId, useState, type ReactNode } from 'react';

export const Accordion = ({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return <section className="quests-page__panel quests-page__accordion">
    <h2><button type="button" className="quests-page__accordion-toggle" id={id + '-heading'}
      aria-expanded={open} aria-controls={id + '-content'} onClick={() => setOpen(value => !value)}>
      <span>{title}</span><span className={open ? 'quests-page__arrow quests-page__arrow--open' : 'quests-page__arrow'} aria-hidden="true" />
    </button></h2>
    <div className="quests-page__accordion-body" id={id + '-content'} aria-labelledby={id + '-heading'} role="region" hidden={!open}>{children}</div>
  </section>;
};
