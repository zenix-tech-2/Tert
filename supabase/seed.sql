-- DBI seed: official formations, ebooks, boutique products and sample contacts.
-- Safe to re-run (skips rows that already exist by title).

INSERT INTO catalog_items (kind, title, description, category, price, promo, cover_url, duration_label, format, access_url)
SELECT * FROM (VALUES
 ('formation','FORMATION EN IA','comment creer : le contenue, les images pro, les vidéos et les clips avec l''intelligence artificielle. Quelle IA faut-il utiliser ? Comment créer un clip vidéo, générer des images, utiliser l''IA comme assistant et cloner sa voix.','Intelligence Artificielle',0,true,'/images/f-ia.jpg','3h30','video','https://www.youtube.com/'),
 ('formation','BOOSTER VOS ABONNÉS EN UN CLIQUE','cette formation vous montre comment booster vos abonnés sur YouTube, TikTok, Instagram, Telegram, Facebook et X.','Réseaux sociaux',0,true,'/images/f-abonnes.jpg','00h10min','video','https://www.youtube.com/'),
 ('formation','CREATION DE CONTENU','avec cette formation apprends etape par etape à devenir créateur de contenu et transformer tes idées et ton business en contenus de qualité.','Création de contenu',0,true,'/images/f-contenu.jpg','00h31min','video','https://www.youtube.com/'),
 ('formation','CRYPTO MONNAIE','Avec cette formation sur la CRYPTO MONNAIE tu comprends enfin c''est quoi la crypto monnaie, quelle plateforme d''échange utiliser, comment faire le P2P, comment envoyer ou recevoir des crypto.','Crypto',0,true,'/images/f-crypto.jpg','1h10 minutes','video','https://www.youtube.com/'),
 ('formation','MONÉTISATION FACEBOOK & TIKTOK','Toutes les étapes pour monétiser vos pages Facebook et comptes TikTok depuis l''Afrique.','Monétisation',2500,false,'/images/f-monetisation.jpg','2h15','video','https://www.youtube.com/'),
 ('formation','ACHATS EN CHINE (1688 / ALIBABA)','Importer depuis la Chine : trouver les fournisseurs, négocier, payer et faire livrer vos colis.','E-commerce',5000,true,'/images/f-chine.jpg','1h45','video','https://www.youtube.com/'),
 ('formation','FACEBOOK ADS DE A À Z','Créer, cibler et optimiser vos campagnes Facebook Ads pour vendre plus.','Marketing',3000,false,'/images/f-fbads.jpg','2h40','video','https://www.youtube.com/'),
 ('formation','CRÉER UN BOT WHATSAPP','Automatisez vos réponses WhatsApp et vendez 24h/24 grâce à un bot simple à mettre en place.','Automatisation',0,false,'/images/f-bot.jpg','00h55min','video','https://www.youtube.com/'),
 ('ebook','DEVELOPPEMENT DURABLE','Ces ebooks vous aident a comprendre le développement durable et à bâtir un business responsable.','Business',0,true,'/images/e-durable.jpg',NULL,'drive','https://drive.google.com/'),
 ('ebook','CONCENTRATION DES ENTREPRISES','Ce pack contient 4 E-BOOK qui vont vous aider à comprendre les fusions, acquisitions et stratégies de croissance.','Business',0,true,'/images/e-entreprises.jpg',NULL,'drive','https://drive.google.com/'),
 ('product','DBI Academy – Pack Développement Personnel','Pack complet de formations en développement personnel : confiance en soi, productivité et leadership.','Développement Personnel',4900,true,NULL,NULL,NULL,'https://drive.google.com/'),
 ('product','Templates Canva Business (200+)','Plus de 200 modèles Canva prêts à l''emploi pour vos visuels WhatsApp, Facebook et Instagram.','Design',1500,false,NULL,NULL,NULL,'https://drive.google.com/'),
 ('product','Pack 1000 vidéos virales sans droits','Bibliothèque de vidéos pour alimenter vos statuts et pages sans problème de droits d''auteur.','Contenu',2900,true,NULL,NULL,NULL,'https://drive.google.com/'),
 ('product','Script de vente WhatsApp','Le script exact pour convertir vos prospects WhatsApp en clients.','Marketing',990,false,NULL,NULL,NULL,'https://drive.google.com/'),
 ('product','Guide Dropshipping Afrique 2026','Lancer une boutique dropshipping rentable en Afrique francophone.','E-commerce',3500,false,NULL,NULL,NULL,'https://drive.google.com/')
) AS v(kind,title,description,category,price,promo,cover_url,duration_label,format,access_url)
WHERE NOT EXISTS (SELECT 1 FROM catalog_items c WHERE c.title = v.title);

INSERT INTO contacts (name, phone, country_code, country_name, city, age, profession, gender, created_at)
SELECT * FROM (VALUES
 ('Da','+22670123456','BF','Burkina Faso','Pô',29,'Commerçant','M', now() - interval '3 days'),
 ('AndréSagno','+224621234567','GN','Guinea','Conakry',34,'Entrepreneur','M', now() - interval '5 days'),
 ('Siagbe Jacque','+2250701234567','CI','Cote d Ivoire','Abidjan',27,'Étudiant','M', now() - interval '6 days'),
 ('Mariam Koné','+22376123456','ML','Mali','Bamako',31,'Commerçante','F', now() - interval '8 days'),
 ('Chabo Iakou','+22890123456','TG','Togo','Lomé',25,'Infopreneur','M', now() - interval '10 days'),
 ('Evanns','+2250501234567','CI','Cote d Ivoire','Bouaké',30,'Développeur','M', now() - interval '12 days'),
 ('Fatou Diop','+221771234567','SN','Senegal','Dakar',26,'Étudiante','F', now() - interval '15 days'),
 ('Brice Ngounou','+237690112233','CM','Cameroon','Douala',33,'Entrepreneur','M', now() - interval '18 days'),
 ('Aïcha Bello','+22997123456','BJ','Benin','Cotonou',28,'Commerçante','F', now() - interval '20 days'),
 ('Kofi Mensah','+233241234567','GH','Ghana','Accra',35,'Marketeur','M', now() - interval '25 days'),
 ('Grace Mbarga','+237655443322','CM','Cameroon','Yaoundé',24,'Étudiante','F', now() - interval '30 days'),
 ('Ibrahim Traoré','+22665123456','BF','Burkina Faso','Ouagadougou',38,'Enseignant','M', now() - interval '40 days')
) AS v(name,phone,country_code,country_name,city,age,profession,gender,created_at)
WHERE NOT EXISTS (SELECT 1 FROM contacts c WHERE c.phone = v.phone);


-- Official DBI account (sponsor of the test campaign). Password: ChangeMe123! (bcrypt) — change it after first login.
INSERT INTO users (name, email, password_hash, country_code, dial_code, whatsapp, referral_code, matricule, status, activated_at, balance)
SELECT 'DBI Officiel', 'ads@dbi.app', '$2b$10$XgieLWRQ2n94bW7b6GuKn.sKSyFLA14p1Z.u.8MVXutT5yqWd.CI6', 'CM', '+237', '+237650000000', 'DBIOFFICIEL', 'DBI2026000001A', 'active', now(), 0
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ads@dbi.app');

-- Test campaign every new diffuseur must validate before paid campaigns.
INSERT INTO ad_campaigns (advertiser_id, title, media_type, media_url, description, publish_text, budget, currency, budget_xaf, cost_per_view, target_views, days, bonus_days, whatsapp, website, target_countries, target_cities, interests, age_min, age_max, is_test, status, tracking_code, starts_at, ends_at)
SELECT u.id,
 'GAGNE DE L''ARGENT AVEC TES VUES WHATSAPP','image','/images/campaign-test.svg',
 'avec la nouvelle fonctionalite DBI Ads Network tu peux desormais monetiser tes vues sur whatsapp te faire jusqu''a 80.000 FCFA chaque semaine',
 'A LA DBI C''EST DESORMAIS POSSIBLE DE PUBLIER DES ANNONCES SUR TES STATUTS WHATSAPP ET DE GAGNER JUSQU''A 1,80FCFA PAR VUE VALIDE',
 0,'XAF',0,0,100000,2,0,'+237650000000',NULL,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,18,120,true,'active','dbitest01', now(), now() + interval '365 days'
FROM users u WHERE u.email = 'ads@dbi.app'
AND NOT EXISTS (SELECT 1 FROM ad_campaigns WHERE tracking_code = 'dbitest01');

-- Re-point previously seeded covers to bundled local files (idempotent).
UPDATE catalog_items SET cover_url = regexp_replace(cover_url, '^https://images\.pexels\.com/photos/(\d+)/.*$', '\1')
WHERE cover_url LIKE 'https://images.pexels.com/%';
UPDATE catalog_items SET cover_url = CASE cover_url
 WHEN '8217428' THEN '/images/f-ia.jpg' WHEN '4173173' THEN '/images/f-abonnes.jpg' WHEN '36766756' THEN '/images/f-contenu.jpg'
 WHEN '5584003' THEN '/images/f-crypto.jpg' WHEN '9301400' THEN '/images/f-monetisation.jpg' WHEN '17483526' THEN '/images/f-chine.jpg'
 WHEN '6699306' THEN '/images/f-fbads.jpg' WHEN '36766766' THEN '/images/f-bot.jpg' WHEN '6344087' THEN '/images/e-durable.jpg'
 WHEN '7193776' THEN '/images/e-entreprises.jpg' ELSE cover_url END
WHERE cover_url ~ '^\d+$';


-- Administrator account for the admin panel (admin/). Password: ChangeMe123! — change it after first login.
INSERT INTO users (name, email, password_hash, country_code, dial_code, whatsapp, referral_code, matricule, status, activated_at, role)
SELECT 'Administrateur DBI', 'admin@dbi.app', '$2b$10$XgieLWRQ2n94bW7b6GuKn.sKSyFLA14p1Z.u.8MVXutT5yqWd.CI6', 'CM', '+237', '+237650000001', 'DBIADMIN', 'DBI2026000002B', 'active', now(), 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@dbi.app');
UPDATE users SET role = 'admin' WHERE email = 'admin@dbi.app' AND role <> 'admin';
