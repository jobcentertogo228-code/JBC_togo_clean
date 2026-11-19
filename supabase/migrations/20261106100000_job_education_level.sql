alter table public.jobs
  add column minimum_education_level text check (
    minimum_education_level is null
    or minimum_education_level in (
      'none',
      'primary',
      'secondary',
      'high_school',
      'bac_plus_2',
      'bachelor',
      'master',
      'doctorate'
    )
  );
