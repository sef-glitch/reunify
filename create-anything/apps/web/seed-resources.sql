-- Seed Resources for Reunify
-- National resources and sample state entries (NY)

-- Clear existing resources (optional, remove if you want to append)
-- DELETE FROM resources;

-- National Resources
INSERT INTO resources (name, state, category, description, url, phone) VALUES
('Childhelp National Child Abuse Hotline', 'National', 'Hotline', 'Crisis counseling and referrals for child abuse situations. Available 24/7.', 'https://www.childhelp.org/hotline/', '1-800-422-4453'),
('National Parent Helpline', 'National', 'Hotline', 'Emotional support and resources for parents. Monday-Friday 10am-7pm PT.', 'https://www.nationalparenthelpline.org/', '1-855-427-2736'),
('National Domestic Violence Hotline', 'National', 'Domestic Violence', 'Confidential support for domestic violence survivors. Available 24/7.', 'https://www.thehotline.org/', '1-800-799-7233'),
('SAMHSA National Helpline', 'National', 'Substance Support', 'Free, confidential treatment referral and information. Available 24/7, 365 days.', 'https://www.samhsa.gov/find-help/national-helpline', '1-800-662-4357'),
('211 United Way', 'National', 'Other', 'Connect to local resources for housing, food, utilities, and more.', 'https://www.211.org/', '211'),
('Legal Services Corporation', 'National', 'Legal Aid', 'Find free legal aid programs in your area for civil legal issues.', 'https://www.lsc.gov/what-legal-aid/find-legal-aid', NULL),
('Parents Anonymous', 'National', 'Parenting Classes', 'Free support groups and resources for parents seeking to strengthen families.', 'https://parentsanonymous.org/', '1-800-352-0386'),
('National Alliance on Mental Illness (NAMI)', 'National', 'Mental Health', 'Mental health education, support groups, and advocacy.', 'https://www.nami.org/', '1-800-950-6264'),
('HUD Housing Counseling', 'National', 'Housing', 'Free or low-cost housing counseling from HUD-approved agencies.', 'https://www.hud.gov/findacounselor', '1-800-569-4287')
ON CONFLICT DO NOTHING;

-- New York Resources
INSERT INTO resources (name, state, category, description, url, phone) VALUES
('New York Legal Assistance Group (NYLAG)', 'New York', 'Legal Aid', 'Free civil legal services for low-income New Yorkers, including family law.', 'https://www.nylag.org/', '212-613-5000'),
('The Legal Aid Society', 'New York', 'Legal Aid', 'Free legal services for low-income individuals in NYC, including family court representation.', 'https://legalaidnyc.org/', '212-577-3300'),
('NYC Administration for Childrens Services', 'New York', 'CPS/Agency', 'New York City child welfare agency. Information on cases, services, and support.', 'https://www.nyc.gov/site/acs/index.page', '212-341-0900'),
('NYS Office of Children and Family Services', 'New York', 'CPS/Agency', 'State agency overseeing child welfare, foster care, and family services.', 'https://ocfs.ny.gov/', '518-473-7793'),
('NYC Family Court', 'New York', 'Court', 'Information about NYC Family Court procedures, locations, and self-help resources.', 'https://ww2.nycourts.gov/courts/nyc/family/', NULL),
('The Door', 'New York', 'Mental Health', 'Free mental health counseling and youth services in NYC.', 'https://door.org/', '212-941-9090'),
('Safe Horizon', 'New York', 'Domestic Violence', 'Victim assistance, domestic violence shelters, and support services in NYC.', 'https://www.safehorizon.org/', '1-800-621-4673'),
('CASES NYC', 'New York', 'Substance Support', 'Substance abuse treatment and mental health services in NYC.', 'https://www.cases.org/', '212-553-6300'),
('Win NYC (Women In Need)', 'New York', 'Housing', 'Family shelter and housing assistance for homeless families in NYC.', 'https://winnyc.org/', '212-695-4758'),
('SCO Family of Services', 'New York', 'Parenting Classes', 'Family support, parenting programs, and child welfare services in NYC.', 'https://sco.org/', '718-260-8996')
ON CONFLICT DO NOTHING;

-- California Resources (sample)
INSERT INTO resources (name, state, category, description, url, phone) VALUES
('California Courts Self-Help', 'California', 'Court', 'Free legal information and self-help resources for California courts.', 'https://www.courts.ca.gov/selfhelp.htm', NULL),
('California Department of Social Services', 'California', 'CPS/Agency', 'State agency for child welfare, foster care, and family support services.', 'https://www.cdss.ca.gov/', '916-651-8848'),
('Legal Aid Foundation of Los Angeles', 'California', 'Legal Aid', 'Free legal services for low-income residents in Los Angeles.', 'https://lafla.org/', '800-399-4529')
ON CONFLICT DO NOTHING;

-- Texas Resources (sample)
INSERT INTO resources (name, state, category, description, url, phone) VALUES
('Texas RioGrande Legal Aid', 'Texas', 'Legal Aid', 'Free legal services for low-income Texans in civil matters.', 'https://www.trla.org/', '888-988-9996'),
('Texas Department of Family and Protective Services', 'Texas', 'CPS/Agency', 'State child protective services, foster care, and family support.', 'https://www.dfps.texas.gov/', '800-252-5400'),
('Texas Courts Self-Help', 'Texas', 'Court', 'Self-help resources for navigating Texas family courts.', 'https://www.txcourts.gov/programs-services/self-help/', NULL)
ON CONFLICT DO NOTHING;
