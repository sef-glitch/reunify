-- =============================================================================
-- REUNIFY RESOURCES SEED DATA - ALL 50 STATES + NATIONAL
-- =============================================================================
-- Idempotent: Deletes existing seeded resources and re-inserts
-- Run with: psql $DATABASE_URL -f seed-resources-50states.sql
-- =============================================================================

BEGIN;

-- Clear existing resources (seeded data only - keeps user-added resources if any)
-- Includes both abbreviations and full state names for cleanup
DELETE FROM resources WHERE state IN (
  'National', 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
  -- Full state names (legacy cleanup)
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
  'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'District of Columbia'
);

-- =============================================================================
-- NATIONAL RESOURCES
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('National', 'legal', 'Child Welfare Information Gateway', 'https://www.childwelfare.gov/', 'Federal resource for child welfare laws, statistics, and family support information'),
('National', 'legal', 'LawHelp.org', 'https://www.lawhelp.org/', 'Find free legal aid programs in your state'),
('National', 'legal', 'American Bar Association Family Law', 'https://www.americanbar.org/groups/family_law/', 'Family law resources and attorney referrals'),
('National', 'support', 'Parents Anonymous', 'https://parentsanonymous.org/', 'Peer support groups for parents strengthening families'),
('National', 'support', 'National Parent Helpline', 'https://www.nationalparenthelpline.org/', 'Emotional support and resources for parents - 1-855-427-2736'),
('National', 'support', 'Childhelp National Hotline', 'https://www.childhelp.org/hotline/', '24/7 crisis hotline for family support - 1-800-422-4453'),
('National', 'housing', 'HUD Housing Counseling', 'https://www.hud.gov/counseling', 'Find HUD-approved housing counseling agencies'),
('National', 'housing', 'National Low Income Housing Coalition', 'https://nlihc.org/', 'Affordable housing resources and advocacy'),
('National', 'substance', 'SAMHSA National Helpline', 'https://www.samhsa.gov/find-help/national-helpline', 'Free treatment referrals 24/7 - 1-800-662-4357'),
('National', 'substance', 'Narcotics Anonymous', 'https://www.na.org/', 'Find local NA meetings and recovery support'),
('National', 'mental_health', 'NAMI - National Alliance on Mental Illness', 'https://www.nami.org/', 'Mental health support, education, and advocacy'),
('National', 'mental_health', '988 Suicide & Crisis Lifeline', 'https://988lifeline.org/', '24/7 crisis support - call or text 988');

-- =============================================================================
-- ALABAMA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('AL', 'legal', 'Legal Services Alabama', 'https://www.legalservicesalabama.org/', 'Free civil legal services for low-income Alabamians'),
('AL', 'legal', 'Alabama Courts', 'https://judicial.alabama.gov/', 'Alabama Unified Judicial System - court information and forms'),
('AL', 'agency', 'Alabama DHR - Child Welfare', 'https://dhr.alabama.gov/child-protective-services/', 'Alabama Department of Human Resources child welfare services');

-- =============================================================================
-- ALASKA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('AK', 'legal', 'Alaska Legal Services Corporation', 'https://www.alsc-law.org/', 'Free legal help for eligible Alaskans'),
('AK', 'legal', 'Alaska Court System', 'https://courts.alaska.gov/', 'Alaska state courts - forms, self-help, and case information'),
('AK', 'agency', 'Alaska OCS - Office of Children''s Services', 'https://health.alaska.gov/ocs/', 'Alaska child protective services and family support');

-- =============================================================================
-- ARIZONA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('AZ', 'legal', 'Community Legal Services Arizona', 'https://www.clsaz.org/', 'Free legal assistance for low-income Arizonans'),
('AZ', 'legal', 'Arizona Judicial Branch', 'https://www.azcourts.gov/', 'Arizona courts - self-service center and court forms'),
('AZ', 'agency', 'Arizona DCS - Department of Child Safety', 'https://dcs.az.gov/', 'Arizona child welfare and family services');

-- =============================================================================
-- ARKANSAS
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('AR', 'legal', 'Legal Aid of Arkansas', 'https://arlegalaid.org/', 'Free civil legal services across Arkansas'),
('AR', 'legal', 'Arkansas Judiciary', 'https://www.arcourts.gov/', 'Arkansas court system information and resources'),
('AR', 'agency', 'Arkansas DCFS', 'https://humanservices.arkansas.gov/divisions/dcfs/', 'Division of Children and Family Services');

-- =============================================================================
-- CALIFORNIA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('CA', 'legal', 'Legal Aid Association of California', 'https://laaconline.org/', 'Network of legal aid organizations serving California'),
('CA', 'legal', 'California Courts Self-Help', 'https://www.courts.ca.gov/selfhelp.htm', 'Self-help resources for California family court'),
('CA', 'agency', 'California CDSS - Child Welfare', 'https://www.cdss.ca.gov/inforesources/child-welfare-protection', 'California child welfare services information'),
('CA', 'support', 'California Parent & Youth Helpline', 'https://caparentyouthhelpline.org/', 'Support line for families - 1-855-427-2736');

-- =============================================================================
-- COLORADO
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('CO', 'legal', 'Colorado Legal Services', 'https://www.coloradolegalservices.org/', 'Free legal help for low-income Coloradans'),
('CO', 'legal', 'Colorado Judicial Branch', 'https://www.courts.state.co.us/', 'Colorado courts - self-help and family court resources'),
('CO', 'agency', 'Colorado CDHS - Child Welfare', 'https://cdhs.colorado.gov/our-services/child-and-family-services/child-welfare', 'Colorado child welfare services');

-- =============================================================================
-- CONNECTICUT
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('CT', 'legal', 'Statewide Legal Services of Connecticut', 'https://www.slsct.org/', 'Free civil legal services for Connecticut residents'),
('CT', 'legal', 'Connecticut Judicial Branch', 'https://www.jud.ct.gov/', 'Connecticut courts - forms and self-help center'),
('CT', 'agency', 'Connecticut DCF', 'https://portal.ct.gov/dcf', 'Department of Children and Families');

-- =============================================================================
-- DELAWARE
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('DE', 'legal', 'Delaware Volunteer Legal Services', 'https://www.dvls.org/', 'Free legal help for Delawareans in need'),
('DE', 'legal', 'Delaware Courts', 'https://courts.delaware.gov/', 'Delaware court system - forms and resources'),
('DE', 'agency', 'Delaware DSCYF', 'https://kids.delaware.gov/', 'Division of Services for Children, Youth and Families');

-- =============================================================================
-- FLORIDA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('FL', 'legal', 'Florida Legal Services', 'https://www.floridalegal.org/', 'Statewide legal aid coordination for Florida'),
('FL', 'legal', 'Florida Courts Self-Help', 'https://www.flcourts.gov/Resources-Services/Family-Courts/Self-Help-Information', 'Florida family court self-help resources'),
('FL', 'agency', 'Florida DCF - Child Welfare', 'https://www.myflfamilies.com/service-programs/child-welfare/', 'Florida child welfare services and resources');

-- =============================================================================
-- GEORGIA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('GA', 'legal', 'Georgia Legal Services Program', 'https://www.glsp.org/', 'Free legal services for low-income Georgians'),
('GA', 'legal', 'Georgia Courts', 'https://georgiacourts.gov/', 'Georgia judicial system - court information'),
('GA', 'agency', 'Georgia DFCS - Child Welfare', 'https://dfcs.georgia.gov/child-welfare-services', 'Division of Family and Children Services');

-- =============================================================================
-- HAWAII
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('HI', 'legal', 'Legal Aid Society of Hawaii', 'https://www.legalaidhawaii.org/', 'Free legal services for Hawaii residents'),
('HI', 'legal', 'Hawaii State Judiciary', 'https://www.courts.state.hi.us/', 'Hawaii courts - self-help center and forms'),
('HI', 'agency', 'Hawaii DHS - Child Welfare', 'https://humanservices.hawaii.gov/ssd/home/child-welfare-services/', 'Hawaii child welfare services');

-- =============================================================================
-- IDAHO
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('ID', 'legal', 'Idaho Legal Aid Services', 'https://www.idaholegalaid.org/', 'Free legal help for low-income Idahoans'),
('ID', 'legal', 'Idaho Courts', 'https://isc.idaho.gov/', 'Idaho Supreme Court - court assistance'),
('ID', 'agency', 'Idaho DHW - Child Welfare', 'https://healthandwelfare.idaho.gov/services-programs/children-families/child-protection', 'Idaho child protection services');

-- =============================================================================
-- ILLINOIS
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('IL', 'legal', 'Illinois Legal Aid Online', 'https://www.illinoislegalaid.org/', 'Free legal information and referrals for Illinois'),
('IL', 'legal', 'Illinois Courts', 'https://www.illinoiscourts.gov/', 'Illinois judiciary - court forms and self-help'),
('IL', 'agency', 'Illinois DCFS', 'https://dcfs.illinois.gov/', 'Department of Children and Family Services');

-- =============================================================================
-- INDIANA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('IN', 'legal', 'Indiana Legal Services', 'https://www.indianalegalservices.org/', 'Free civil legal services for Hoosiers'),
('IN', 'legal', 'Indiana Courts', 'https://www.in.gov/courts/', 'Indiana judiciary - self-service legal center'),
('IN', 'agency', 'Indiana DCS', 'https://www.in.gov/dcs/', 'Department of Child Services');

-- =============================================================================
-- IOWA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('IA', 'legal', 'Iowa Legal Aid', 'https://www.iowalegalaid.org/', 'Free legal help for low-income Iowans'),
('IA', 'legal', 'Iowa Judicial Branch', 'https://www.iowacourts.gov/', 'Iowa courts - self-represented litigant resources'),
('IA', 'agency', 'Iowa HHS - Child Welfare', 'https://hhs.iowa.gov/child-welfare', 'Iowa child welfare services');

-- =============================================================================
-- KANSAS
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('KS', 'legal', 'Kansas Legal Services', 'https://www.kansaslegalservices.org/', 'Free legal assistance for Kansans in need'),
('KS', 'legal', 'Kansas Courts', 'https://www.kscourts.org/', 'Kansas judicial branch - self-help resources'),
('KS', 'agency', 'Kansas DCF - Child Welfare', 'https://www.dcf.ks.gov/services/PPS/Pages/ChildProtectiveServices.aspx', 'Kansas child protective services');

-- =============================================================================
-- KENTUCKY
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('KY', 'legal', 'Legal Aid of the Bluegrass', 'https://lablaw.org/', 'Free legal services for central and eastern Kentucky'),
('KY', 'legal', 'Kentucky Court of Justice', 'https://courts.ky.gov/', 'Kentucky courts - forms and self-help'),
('KY', 'agency', 'Kentucky CHFS - Child Welfare', 'https://chfs.ky.gov/agencies/dcbs/dpp/Pages/default.aspx', 'Cabinet for Health and Family Services');

-- =============================================================================
-- LOUISIANA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('LA', 'legal', 'Southeast Louisiana Legal Services', 'https://slls.org/', 'Free legal aid for southeast Louisiana'),
('LA', 'legal', 'Louisiana Courts', 'https://www.lasc.org/', 'Louisiana Supreme Court - court resources'),
('LA', 'agency', 'Louisiana DCFS - Child Welfare', 'https://www.dcfs.louisiana.gov/page/child-welfare', 'Louisiana child welfare services');

-- =============================================================================
-- MAINE
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('ME', 'legal', 'Pine Tree Legal Assistance', 'https://ptla.org/', 'Free legal help for low-income Mainers'),
('ME', 'legal', 'Maine Courts', 'https://www.courts.maine.gov/', 'Maine judicial branch - self-help center'),
('ME', 'agency', 'Maine DHHS - Child Welfare', 'https://www.maine.gov/dhhs/ocfs/cw/', 'Office of Child and Family Services');

-- =============================================================================
-- MARYLAND
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('MD', 'legal', 'Maryland Legal Aid', 'https://www.mdlab.org/', 'Free civil legal services for Marylanders'),
('MD', 'legal', 'Maryland Courts', 'https://www.mdcourts.gov/', 'Maryland judiciary - self-help center'),
('MD', 'agency', 'Maryland DHS - Child Welfare', 'https://dhs.maryland.gov/child-protective-services/', 'Maryland child protective services');

-- =============================================================================
-- MASSACHUSETTS
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('MA', 'legal', 'Massachusetts Legal Aid', 'https://www.masslegalhelp.org/', 'Free legal information and referrals for Massachusetts'),
('MA', 'legal', 'Massachusetts Courts', 'https://www.mass.gov/orgs/trial-court', 'Massachusetts trial court - self-help'),
('MA', 'agency', 'Massachusetts DCF', 'https://www.mass.gov/orgs/department-of-children-and-families', 'Department of Children and Families');

-- =============================================================================
-- MICHIGAN
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('MI', 'legal', 'Michigan Legal Help', 'https://michiganlegalhelp.org/', 'Free legal self-help tools for Michiganders'),
('MI', 'legal', 'Michigan Courts', 'https://www.courts.michigan.gov/', 'Michigan judiciary - self-help center'),
('MI', 'agency', 'Michigan DHHS - Child Welfare', 'https://www.michigan.gov/mdhhs/adult-child-serv/children-young-adults/child-welfare', 'Michigan child welfare services');

-- =============================================================================
-- MINNESOTA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('MN', 'legal', 'Legal Aid State Support', 'https://www.lawhelpmn.org/', 'Free legal help for low-income Minnesotans'),
('MN', 'legal', 'Minnesota Judicial Branch', 'https://www.mncourts.gov/', 'Minnesota courts - self-help center'),
('MN', 'agency', 'Minnesota DHS - Child Welfare', 'https://mn.gov/dhs/people-we-serve/children-and-families/services/child-protection/', 'Minnesota child protection services');

-- =============================================================================
-- MISSISSIPPI
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('MS', 'legal', 'Mississippi Center for Legal Services', 'https://mslegalservices.org/', 'Free legal help for low-income Mississippians'),
('MS', 'legal', 'Mississippi Courts', 'https://courts.ms.gov/', 'Mississippi judiciary - court information'),
('MS', 'agency', 'Mississippi MDCPS', 'https://www.mdcps.ms.gov/', 'Department of Child Protection Services');

-- =============================================================================
-- MISSOURI
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('MO', 'legal', 'Legal Services of Missouri', 'https://www.lsmo.org/', 'Free legal help for low-income Missourians'),
('MO', 'legal', 'Missouri Courts', 'https://www.courts.mo.gov/', 'Missouri judiciary - self-represented litigants'),
('MO', 'agency', 'Missouri DSS - Children''s Division', 'https://dss.mo.gov/cd/', 'Missouri child welfare services');

-- =============================================================================
-- MONTANA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('MT', 'legal', 'Montana Legal Services', 'https://www.mtlsa.org/', 'Free legal aid for eligible Montanans'),
('MT', 'legal', 'Montana Courts', 'https://courts.mt.gov/', 'Montana judiciary - self-help law center'),
('MT', 'agency', 'Montana DPHHS - Child Welfare', 'https://dphhs.mt.gov/cfsd/childprotection', 'Montana child protective services');

-- =============================================================================
-- NEBRASKA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('NE', 'legal', 'Legal Aid of Nebraska', 'https://www.legalaidofnebraska.org/', 'Free legal services for low-income Nebraskans'),
('NE', 'legal', 'Nebraska Judicial Branch', 'https://supremecourt.nebraska.gov/', 'Nebraska courts - self-help resources'),
('NE', 'agency', 'Nebraska DHHS - CFS', 'https://dhhs.ne.gov/Pages/Children-and-Family-Services.aspx', 'Children and Family Services');

-- =============================================================================
-- NEVADA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('NV', 'legal', 'Nevada Legal Services', 'https://nevadalegalservices.org/', 'Free legal help for low-income Nevadans'),
('NV', 'legal', 'Nevada Courts', 'https://nvcourts.gov/', 'Nevada judiciary - self-help center'),
('NV', 'agency', 'Nevada DCFS', 'https://dcfs.nv.gov/', 'Division of Child and Family Services');

-- =============================================================================
-- NEW HAMPSHIRE
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('NH', 'legal', 'New Hampshire Legal Aid', 'https://www.nhla.org/', 'Free civil legal services for New Hampshire'),
('NH', 'legal', 'New Hampshire Courts', 'https://www.courts.nh.gov/', 'NH judiciary - self-help center'),
('NH', 'agency', 'New Hampshire DCYF', 'https://www.dhhs.nh.gov/dcyf/', 'Division for Children, Youth and Families');

-- =============================================================================
-- NEW JERSEY
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('NJ', 'legal', 'Legal Services of New Jersey', 'https://www.lsnj.org/', 'Free legal help for low-income New Jerseyans'),
('NJ', 'legal', 'New Jersey Courts', 'https://www.njcourts.gov/', 'NJ judiciary - self-help resource center'),
('NJ', 'agency', 'New Jersey DCF', 'https://www.nj.gov/dcf/', 'Department of Children and Families');

-- =============================================================================
-- NEW MEXICO
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('NM', 'legal', 'New Mexico Legal Aid', 'https://www.newmexicolegalaid.org/', 'Free legal services for low-income New Mexicans'),
('NM', 'legal', 'New Mexico Courts', 'https://www.nmcourts.gov/', 'NM judiciary - self-help guide'),
('NM', 'agency', 'New Mexico CYFD', 'https://cyfd.nm.gov/', 'Children, Youth and Families Department');

-- =============================================================================
-- NEW YORK
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('NY', 'legal', 'LawHelp New York', 'https://www.lawhelpny.org/', 'Free legal information and referrals for New Yorkers'),
('NY', 'legal', 'New York State Courts', 'https://www.nycourts.gov/', 'NY court system - DIY forms and self-help'),
('NY', 'agency', 'New York OCFS', 'https://ocfs.ny.gov/', 'Office of Children and Family Services'),
('NY', 'support', 'NYC Family Court Help', 'https://www.nycourts.gov/courts/nyc/family/', 'New York City Family Court resources');

-- =============================================================================
-- NORTH CAROLINA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('NC', 'legal', 'Legal Aid of North Carolina', 'https://www.legalaidnc.org/', 'Free legal help for low-income North Carolinians'),
('NC', 'legal', 'North Carolina Courts', 'https://www.nccourts.gov/', 'NC judicial branch - self-service center'),
('NC', 'agency', 'North Carolina DHHS - Child Welfare', 'https://www.ncdhhs.gov/divisions/social-services/child-welfare-services', 'NC child welfare services');

-- =============================================================================
-- NORTH DAKOTA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('ND', 'legal', 'Legal Services of North Dakota', 'https://www.legalassist.org/', 'Free legal help for low-income North Dakotans'),
('ND', 'legal', 'North Dakota Courts', 'https://www.ndcourts.gov/', 'ND judiciary - self-help center'),
('ND', 'agency', 'North Dakota DHS - Child Welfare', 'https://www.hhs.nd.gov/services/child-welfare', 'ND child welfare services');

-- =============================================================================
-- OHIO
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('OH', 'legal', 'Ohio Legal Help', 'https://www.ohiolegalhelp.org/', 'Free legal information for Ohioans'),
('OH', 'legal', 'Ohio Courts', 'https://www.ohiocourts.gov/', 'Ohio judiciary - self-help resources'),
('OH', 'agency', 'Ohio ODJFS - Child Welfare', 'https://jfs.ohio.gov/children/child-welfare', 'Ohio child welfare services');

-- =============================================================================
-- OKLAHOMA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('OK', 'legal', 'Legal Aid Services of Oklahoma', 'https://www.legalaidok.org/', 'Free legal help for low-income Oklahomans'),
('OK', 'legal', 'Oklahoma Courts', 'https://www.oscn.net/', 'Oklahoma court network - case information'),
('OK', 'agency', 'Oklahoma DHS - Child Welfare', 'https://oklahoma.gov/okdhs/services/child-welfare.html', 'Oklahoma child welfare services');

-- =============================================================================
-- OREGON
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('OR', 'legal', 'Oregon Law Help', 'https://oregonlawhelp.org/', 'Free legal information for Oregonians'),
('OR', 'legal', 'Oregon Courts', 'https://www.courts.oregon.gov/', 'Oregon judicial department - self-help'),
('OR', 'agency', 'Oregon DHS - Child Welfare', 'https://www.oregon.gov/odhs/child-welfare/', 'Oregon child welfare program');

-- =============================================================================
-- PENNSYLVANIA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('PA', 'legal', 'Pennsylvania Legal Aid Network', 'https://palegalaid.net/', 'Free legal services for low-income Pennsylvanians'),
('PA', 'legal', 'Pennsylvania Courts', 'https://www.pacourts.us/', 'PA unified judicial system - self-help'),
('PA', 'agency', 'Pennsylvania DHS - Child Welfare', 'https://www.dhs.pa.gov/Services/Children/Pages/default.aspx', 'PA child welfare services');

-- =============================================================================
-- RHODE ISLAND
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('RI', 'legal', 'Rhode Island Legal Services', 'https://www.rils.org/', 'Free legal help for low-income Rhode Islanders'),
('RI', 'legal', 'Rhode Island Courts', 'https://www.courts.ri.gov/', 'RI judiciary - self-help center'),
('RI', 'agency', 'Rhode Island DCYF', 'https://dcyf.ri.gov/', 'Department of Children, Youth and Families');

-- =============================================================================
-- SOUTH CAROLINA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('SC', 'legal', 'South Carolina Legal Services', 'https://sclegal.org/', 'Free legal help for low-income South Carolinians'),
('SC', 'legal', 'South Carolina Courts', 'https://www.sccourts.org/', 'SC judicial department - self-help'),
('SC', 'agency', 'South Carolina DSS - Child Welfare', 'https://dss.sc.gov/child-welfare/', 'SC child welfare services');

-- =============================================================================
-- SOUTH DAKOTA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('SD', 'legal', 'East River Legal Services', 'https://www.erlservices.org/', 'Free legal help for eastern South Dakota'),
('SD', 'legal', 'South Dakota Courts', 'https://ujs.sd.gov/', 'SD unified judicial system - self-help'),
('SD', 'agency', 'South Dakota DSS - Child Protection', 'https://dss.sd.gov/childprotection/', 'SD child protection services');

-- =============================================================================
-- TENNESSEE
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('TN', 'legal', 'Tennessee Legal Aid', 'https://www.tals.org/', 'Free legal help for low-income Tennesseans'),
('TN', 'legal', 'Tennessee Courts', 'https://www.tncourts.gov/', 'TN court system - self-help center'),
('TN', 'agency', 'Tennessee DCS', 'https://www.tn.gov/dcs/', 'Department of Children''s Services');

-- =============================================================================
-- TEXAS
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('TX', 'legal', 'Texas RioGrande Legal Aid', 'https://www.trla.org/', 'Free legal services for low-income Texans'),
('TX', 'legal', 'Texas Courts', 'https://www.txcourts.gov/', 'Texas judiciary - self-help resources'),
('TX', 'agency', 'Texas DFPS - Child Protective Services', 'https://www.dfps.texas.gov/child_protection/', 'Texas child protective services'),
('TX', 'legal', 'Lone Star Legal Aid', 'https://www.lonestarlegal.org/', 'Free legal help for southeast Texas');

-- =============================================================================
-- UTAH
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('UT', 'legal', 'Utah Legal Services', 'https://www.utahlegalservices.org/', 'Free legal help for low-income Utahns'),
('UT', 'legal', 'Utah Courts', 'https://www.utcourts.gov/', 'Utah judiciary - self-help center'),
('UT', 'agency', 'Utah DCFS', 'https://dcfs.utah.gov/', 'Division of Child and Family Services');

-- =============================================================================
-- VERMONT
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('VT', 'legal', 'Legal Services Vermont', 'https://www.vtlegalaid.org/', 'Free legal help for low-income Vermonters'),
('VT', 'legal', 'Vermont Courts', 'https://www.vermontjudiciary.org/', 'Vermont judiciary - self-help'),
('VT', 'agency', 'Vermont DCF - Family Services', 'https://dcf.vermont.gov/fsd', 'Vermont Family Services Division');

-- =============================================================================
-- VIRGINIA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('VA', 'legal', 'Virginia Legal Aid', 'https://www.valegalaid.org/', 'Free legal information for Virginians'),
('VA', 'legal', 'Virginia Courts', 'https://www.vacourts.gov/', 'Virginia judiciary - self-help resources'),
('VA', 'agency', 'Virginia DSS - Child Welfare', 'https://www.dss.virginia.gov/family/cps/', 'Virginia child protective services');

-- =============================================================================
-- WASHINGTON
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('WA', 'legal', 'Northwest Justice Project', 'https://nwjustice.org/', 'Free legal help for low-income Washingtonians'),
('WA', 'legal', 'Washington Courts', 'https://www.courts.wa.gov/', 'WA judiciary - self-help resources'),
('WA', 'agency', 'Washington DCYF', 'https://www.dcyf.wa.gov/', 'Department of Children, Youth, and Families');

-- =============================================================================
-- WEST VIRGINIA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('WV', 'legal', 'Legal Aid of West Virginia', 'https://www.lawv.net/', 'Free legal help for low-income West Virginians'),
('WV', 'legal', 'West Virginia Courts', 'https://www.courtswv.gov/', 'WV judiciary - self-help center'),
('WV', 'agency', 'West Virginia DHHR - Child Welfare', 'https://dhhr.wv.gov/bcf/Pages/default.aspx', 'WV Bureau for Children and Families');

-- =============================================================================
-- WISCONSIN
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('WI', 'legal', 'Legal Action of Wisconsin', 'https://www.legalaction.org/', 'Free legal services for low-income Wisconsinites'),
('WI', 'legal', 'Wisconsin Courts', 'https://www.wicourts.gov/', 'Wisconsin judiciary - self-help'),
('WI', 'agency', 'Wisconsin DCF', 'https://dcf.wisconsin.gov/', 'Department of Children and Families');

-- =============================================================================
-- WYOMING
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('WY', 'legal', 'Legal Aid of Wyoming', 'https://www.lawyoming.org/', 'Free legal help for low-income Wyomingites'),
('WY', 'legal', 'Wyoming Courts', 'https://www.courts.state.wy.us/', 'Wyoming judiciary - self-help resources'),
('WY', 'agency', 'Wyoming DFS - Child Welfare', 'https://dfs.wyo.gov/child-protective-services/', 'Wyoming child protective services');

-- =============================================================================
-- DISTRICT OF COLUMBIA
-- =============================================================================
INSERT INTO resources (state, category, name, url, description) VALUES
('DC', 'legal', 'Legal Aid DC', 'https://www.legalaiddc.org/', 'Free legal help for low-income DC residents'),
('DC', 'legal', 'DC Courts', 'https://www.dccourts.gov/', 'DC court system - self-help center'),
('DC', 'agency', 'DC CFSA', 'https://cfsa.dc.gov/', 'Child and Family Services Agency');

COMMIT;

-- Summary
SELECT state, COUNT(*) as resource_count
FROM resources
GROUP BY state
ORDER BY
  CASE WHEN state = 'National' THEN 0 ELSE 1 END,
  state;
