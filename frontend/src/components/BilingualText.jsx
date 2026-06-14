import React from 'react';

export default function BilingualText({
  as: Component = 'p',
  children,
  translation,
  className = '',
  translationClassName = 'text-slate-500 text-sm leading-snug',
  containerClassName = 'space-y-2',
  labelClassName = 'font-semibold',
}) {
  return (
    <div className={containerClassName}>
      <Component className={className}>{children}</Component>
      {translation ? (
        <p className={translationClassName}>{translation}</p>
      ) : null}
    </div>
  );
}
