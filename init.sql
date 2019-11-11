CREATE TABLE phone_numbers (
  id serial,
  number varchar(12),
  text boolean
  );

INSERT INTO phone_numbers(number, text)
  VALUES 
    ('+13476660555', TRUE),
    ('+19174368636', TRUE);