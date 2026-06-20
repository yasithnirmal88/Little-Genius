-- Little Genius - Seed Content (Modules, Lessons, Quizzes, Questions)
-- Run this AFTER schema.sql to add demo content

INSERT INTO public.modules (tier, title, emoji, description, locked, domains, status, sort_order)
SELECT * FROM (VALUES
  (1, 'Space Exploration', '🚀', 'Blast off into the cosmos! Learn about stars, planets, and our solar system.', false, ARRAY['Space & Astronomy'], 'published'::content_status, 1),
  (1, 'Animal Kingdom', '🦁', 'Discover amazing animals from around the world and how they survive.', false, ARRAY['Biology', 'Animals'], 'published'::content_status, 2),
  (2, 'Weather Wonders', '🌈', 'Why does it rain? What makes a rainbow? Explore the weather around you!', true, ARRAY['Weather', 'Earth Science'], 'published'::content_status, 3),
  (2, 'Human Body', '🧠', 'Learn about the incredible machine that is your body!', true, ARRAY['Human Body', 'Biology'], 'published'::content_status, 4),
  (3, 'Ocean Explorers', '🐠', 'Dive deep into the ocean and meet the creatures that live there.', true, ARRAY['Ocean Science'], 'published'::content_status, 5),
  (3, 'Dinosaur World', '🦕', 'Travel back in time to when dinosaurs roamed the Earth!', true, ARRAY['Dinosaurs & Fossils'], 'published'::content_status, 6)
) AS v(tier, title, emoji, description, locked, domains, status, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.modules WHERE title = v.title);

DO $$
DECLARE
  mod_id BIGINT;
  quiz_id BIGINT;
BEGIN
  -- === Module: Space Exploration ===
  SELECT id INTO mod_id FROM public.modules WHERE title = 'Space Exploration' LIMIT 1;

  IF mod_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.lessons WHERE module_id = mod_id) THEN
    INSERT INTO public.lessons (module_id, step_number, title, video_url, knowledge_text)
    VALUES
      (mod_id, 1, 'Our Solar System',
       'https://www.youtube.com/watch?v=F2prtmPEjOc',
       'Our solar system is a big family of planets that orbit (go around) the Sun. The Sun is a giant star at the center!

There are 8 planets in our solar system:
Mercury - the smallest and closest to the Sun
Venus - the hottest planet
Earth - our home! The only planet with life we know of
Mars - the red planet
Jupiter - the biggest planet
Saturn - the planet with beautiful rings
Uranus - a blue planet that spins on its side
Neptune - the farthest and coldest planet

Fun fact: All the planets orbit the Sun in the same direction!'),
      (mod_id, 2, 'Stars & Constellations',
       'https://www.youtube.com/watch?v=ke3_sb4W4Ws',
       'Stars are giant balls of hot gas that give off light and heat. Our Sun is a star too!

At night, you can see thousands of stars in the sky. Long ago, people connected the dots between stars to make pictures called constellations.

Famous constellations:
Ursa Major (Big Dipper) - looks like a giant ladle
Orion - looks like a hunter with a bow
Cassiopeia - looks like a W in the sky

Stars come in different colors! Blue stars are the hottest, and red stars are the coolest. Our Sun is a yellow star.');

    INSERT INTO public.quizzes (module_id, lesson_id, title, passing_score, max_attempts)
    VALUES (mod_id, (SELECT id FROM public.lessons WHERE module_id = mod_id AND step_number = 1), 'Our Solar System Quiz', 80, 3)
    RETURNING id INTO quiz_id;

    INSERT INTO public.quiz_questions (quiz_id, question_text, options, correct_index, sort_order) VALUES
      (quiz_id, 'How many planets are in our solar system?', '["6","8","10","12"]'::jsonb, 1, 1),
      (quiz_id, 'What is the Sun?', '["A planet","A moon","A giant star","A comet"]'::jsonb, 2, 2),
      (quiz_id, 'Which planet is known as the red planet?', '["Venus","Jupiter","Mars","Saturn"]'::jsonb, 2, 3),
      (quiz_id, 'Which planet is the biggest in our solar system?', '["Saturn","Neptune","Earth","Jupiter"]'::jsonb, 3, 4),
      (quiz_id, 'What do all planets do around the Sun?', '["Spin in place","Orbit (go around)","Move away","Stay still"]'::jsonb, 1, 5);

    INSERT INTO public.battles (module_id, question, options, correct_answer, explanation, status)
    VALUES (
      mod_id,
      'What makes a planet alive?',
      '["Having water","Being round","Orbiting a star","Having moving parts"]'::jsonb,
      'Having water',
      'A planet is not alive in the same way organisms are, but water supports life conditions. This battle question helps you think as a scientist.',
      'published'::content_status
    );

    INSERT INTO public.quizzes (module_id, lesson_id, title, passing_score, max_attempts)
    VALUES (mod_id, (SELECT id FROM public.lessons WHERE module_id = mod_id AND step_number = 2), 'Stars & Constellations Quiz', 80, 3)
    RETURNING id INTO quiz_id;

    INSERT INTO public.quiz_questions (quiz_id, question_text, options, correct_index, sort_order) VALUES
      (quiz_id, 'What are stars made of?', '["Rock and dirt","Hot gas","Water","Ice"]'::jsonb, 1, 1),
      (quiz_id, 'What do we call dot-to-dot pictures made from stars?', '["Galaxies","Constellations","Nebulas","Comets"]'::jsonb, 1, 2),
      (quiz_id, 'What color are the hottest stars?', '["Red","Yellow","Blue","White"]'::jsonb, 2, 3),
      (quiz_id, 'What color is our Sun?', '["Red","Yellow","Blue","White"]'::jsonb, 1, 4),
      (quiz_id, 'Which constellation looks like a hunter?', '["Big Dipper","Cassiopeia","Orion","Little Dipper"]'::jsonb, 2, 5);

    INSERT INTO public.lessons (module_id, step_number, title, video_url, knowledge_text)
    VALUES (mod_id, 3, 'Exploring the Moon',
      'https://www.youtube.com/watch?v=W2-mxJ9faVg',
      'The Moon is Earth''s best friend in space! It orbits our planet and lights up our night sky.

Facts about the Moon:
The Moon is about 384,400 km away from Earth
It takes about 27 days for the Moon to orbit Earth
The Moon has no air or water - astronauts need special suits!
The first people to walk on the Moon were Neil Armstrong and Buzz Aldrin in 1969
The Moon''s gravity is only 1/6 of Earth''s - you could jump 6 times higher!

The Moon has different phases (shapes) as it orbits Earth:
New Moon -> Crescent -> Quarter -> Gibbous -> Full Moon

Fun fact: The Moon is slowly moving away from Earth at about 3.8 cm per year!');

    INSERT INTO public.quizzes (module_id, lesson_id, title, passing_score, max_attempts)
    VALUES (mod_id, (SELECT id FROM public.lessons WHERE module_id = mod_id AND step_number = 3), 'Exploring the Moon Quiz', 80, 3)
    RETURNING id INTO quiz_id;

    INSERT INTO public.quiz_questions (quiz_id, question_text, options, correct_index, sort_order) VALUES
      (quiz_id, 'How long does it take the Moon to orbit Earth?', '["About 7 days","About 27 days","About 365 days","About 1 day"]'::jsonb, 1, 1),
      (quiz_id, 'Who were the first people to walk on the Moon?', '["Neil Armstrong and Buzz Aldrin","Yuri Gagarin and Sally Ride","John Glenn and Mae Jemison","Isaac Newton and Albert Einstein"]'::jsonb, 0, 2),
      (quiz_id, 'Why do astronauts need special suits on the Moon?', '["Because it is too hot","Because there is no air","Because it rains a lot","Because of the bright light"]'::jsonb, 1, 3),
      (quiz_id, 'If you can jump 1 meter on Earth, how high could you jump on the Moon?', '["1 meter","3 meters","6 meters","10 meters"]'::jsonb, 2, 4),
      (quiz_id, 'What shape is the Moon when it is fully lit?', '["Crescent","Quarter","Full circle","Half"]'::jsonb, 2, 5),
      (quiz_id, 'The Moon is moving away from Earth at about...', '["3.8 cm per year","1 meter per year","10 km per year","It is not moving"]'::jsonb, 0, 6),
      (quiz_id, 'What year did the first Moon landing happen?', '["1959","1969","1979","1989"]'::jsonb, 1, 7),
      (quiz_id, 'The Moon gravity is ____ of Earth gravity.', '["One half","One third","One sixth","The same as"]'::jsonb, 2, 8);
  END IF;
END $$;

DO $$
DECLARE
  mod_id BIGINT;
  quiz_id BIGINT;
BEGIN
  -- === Module: Animal Kingdom ===
  SELECT id INTO mod_id FROM public.modules WHERE title = 'Animal Kingdom' LIMIT 1;

  IF mod_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.lessons WHERE module_id = mod_id) THEN
    INSERT INTO public.lessons (module_id, step_number, title, video_url, knowledge_text)
    VALUES
      (mod_id, 1, 'Mammals & Birds',
       'https://www.youtube.com/watch?v=TP1T9GDzWFk',
       'Animals are amazing! Let''s learn about two big groups: mammals and birds.

MAMMALS:
Have fur or hair on their bodies
Are warm-blooded (their body stays the same temperature)
Mothers feed milk to their babies
Examples: dogs, cats, elephants, whales, and humans!

BIRDS:
Have feathers and wings
Are warm-blooded
Lay eggs with hard shells
Most birds can fly (but not all - penguins and ostriches cannot!)
Examples: eagles, parrots, penguins, owls'),
      (mod_id, 2, 'Reptiles & Amphibians',
       'https://www.youtube.com/watch?v=VzAT8X3uBIs',
       'Now let''s explore reptiles and amphibians!

REPTILES:
Have dry, scaly skin
Are cold-blooded (their body temperature changes with the environment)
Most lay eggs on land
Examples: snakes, lizards, turtles, crocodiles

AMPHIBIANS:
Have smooth, wet skin
Are cold-blooded
Start life in water (as tadpoles) and grow legs to live on land
Examples: frogs, toads, salamanders

Fun fact: A group of frogs is called an army!');

    INSERT INTO public.quizzes (module_id, lesson_id, title, passing_score, max_attempts)
    VALUES (mod_id, (SELECT id FROM public.lessons WHERE module_id = mod_id AND step_number = 1), 'Mammals & Birds Quiz', 80, 3)
    RETURNING id INTO quiz_id;

    INSERT INTO public.quiz_questions (quiz_id, question_text, options, correct_index, sort_order) VALUES
      (quiz_id, 'What do mammals have on their bodies?', '["Feathers","Fur or hair","Scales","Smooth skin"]'::jsonb, 1, 1),
      (quiz_id, 'What do bird mothers feed their babies?', '["Milk","Seeds and worms","Nectar","Fish"]'::jsonb, 1, 2),
      (quiz_id, 'Which of these is NOT a bird?', '["Eagle","Penguin","Bat","Owl"]'::jsonb, 2, 3),
      (quiz_id, 'Are mammals warm-blooded or cold-blooded?', '["Cold-blooded","Warm-blooded","Both","Neither"]'::jsonb, 1, 4),
      (quiz_id, 'What body part do birds have that mammals do not?', '["Fur","Feathers","Teeth","Ears"]'::jsonb, 1, 5);

    INSERT INTO public.quizzes (module_id, lesson_id, title, passing_score, max_attempts)
    VALUES (mod_id, (SELECT id FROM public.lessons WHERE module_id = mod_id AND step_number = 2), 'Reptiles & Amphibians Quiz', 80, 3)
    RETURNING id INTO quiz_id;

    INSERT INTO public.quiz_questions (quiz_id, question_text, options, correct_index, sort_order) VALUES
      (quiz_id, 'What kind of skin do reptiles have?', '["Smooth and wet","Dry and scaly","Furry","Feathery"]'::jsonb, 1, 1),
      (quiz_id, 'What does cold-blooded mean?', '["The animal is always cold","Body temperature changes with the environment","The animal has cold blood","The animal lives in cold places"]'::jsonb, 1, 2),
      (quiz_id, 'Where do amphibians start their life?', '["On land","In trees","In water","In caves"]'::jsonb, 2, 3),
      (quiz_id, 'Which of these is an amphibian?', '["Snake","Turtle","Frog","Crocodile"]'::jsonb, 2, 4),
      (quiz_id, 'A baby frog is called a...', '["Puppy","Tadpole","Cub","Chick"]'::jsonb, 1, 5);

    INSERT INTO public.lessons (module_id, step_number, title, video_url, knowledge_text)
    VALUES (mod_id, 3, 'Animal Superpowers',
      'https://www.youtube.com/watch?v=QZQ25gwWhPk',
      'Some animals have amazing superpowers! Let''s learn about them.

CAMOUFLAGE: Some animals can change their color to hide from enemies.
Chameleons can change color!
Octopuses can change both color AND texture

SUPER STRENGTH:
Ants can carry up to 50 times their own body weight
Dung beetles are the strongest insects

SUPER SPEED:
Cheetahs are the fastest land animals (up to 120 km/h!)
Peregrine falcons dive at 390 km/h - faster than a race car!

BIOLUMINESCENCE: Some animals can make their own light!
Fireflies
Some deep-sea fish and jellyfish

REGENERATION: Some animals can grow back body parts!
Starfish can grow back arms
Salamanders can grow back tails and even legs!');

    INSERT INTO public.quizzes (module_id, lesson_id, title, passing_score, max_attempts)
    VALUES (mod_id, (SELECT id FROM public.lessons WHERE module_id = mod_id AND step_number = 3), 'Animal Superpowers Quiz', 80, 3)
    RETURNING id INTO quiz_id;

    INSERT INTO public.quiz_questions (quiz_id, question_text, options, correct_index, sort_order) VALUES
      (quiz_id, 'What is camouflage?', '["Running very fast","Changing color to hide","Flying high","Sleeping all winter"]'::jsonb, 1, 1),
      (quiz_id, 'Which animal can change both color AND texture?', '["Chameleon","Octopus","Frog","Lizard"]'::jsonb, 1, 2),
      (quiz_id, 'What is the fastest land animal?', '["Lion","Horse","Cheetah","Peregrine falcon"]'::jsonb, 2, 3),
      (quiz_id, 'How much can an ant carry compared to its body weight?', '["5 times","10 times","50 times","100 times"]'::jsonb, 2, 4),
      (quiz_id, 'What is bioluminescence?', '["Making your own light","Flying in the dark","Sleeping during the day","Holding your breath"]'::jsonb, 0, 5),
      (quiz_id, 'Which animal can grow back lost body parts?', '["Dog","Cat","Starfish","Eagle"]'::jsonb, 2, 6),
      (quiz_id, 'How fast can a peregrine falcon dive?', '["120 km/h","200 km/h","390 km/h","500 km/h"]'::jsonb, 2, 7),
      (quiz_id, 'Fireflies use bioluminescence to...', '["Stay warm","Communicate and attract mates","See in the dark","Scare predators"]'::jsonb, 1, 8);
  END IF;
END $$;
