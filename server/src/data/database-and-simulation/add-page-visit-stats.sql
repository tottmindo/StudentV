-- Anonymous aggregate application usage. No user, device, IP, or request data is stored.
CREATE TABLE IF NOT EXISTS page_visit_stats (
  visitdate date NOT NULL,
  page varchar(80) NOT NULL,
  visits integer NOT NULL DEFAULT 0 CHECK (visits >= 0),
  PRIMARY KEY (visitdate, page)
);
