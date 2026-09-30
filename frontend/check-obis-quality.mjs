// Isolated UI fixture; provider QC parsing is tested separately in pytest.
import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 let onlyLand=false;
 await page.route('**/api/**',route=>route.fulfill({json:route.request().url().includes('/biodiversity/obis')?
  {status:'ok',results:[
   {record_id:'water-fixture',scientific_name:'Water fixture',latitude:15,longitude:65,quality:{map_eligible:true,flags:[],reasons:[]}},
   {record_id:'land-fixture',scientific_name:'Land fixture',latitude:21.1,longitude:70.6,event_date:'2000-01-01',quality:{map_eligible:false,flags:['ON_LAND'],reasons:['OBIS flags this coordinate as on land.']}}
  ].filter(row=>!onlyLand || row.quality.flags.includes('ON_LAND')),limitations:[]}:{sources:[],status:'no_data',profiles:[],results:[],limitations:[]}}));
 await page.goto('http://127.0.0.1:3000');
 await page.getByRole('button',{name:'Explore',exact:true}).click();
 await page.getByRole('button',{name:'Load data',exact:true}).click();
 await expect(page.locator('path.leaflet-interactive[stroke="#7c3aed"]')).toHaveCount(1);
 await expect(page.locator('.evidence-card.obis')).toContainText('1 records eligible for map');
 await expect(page.locator('.evidence-card.obis')).toContainText('1 loaded locations are flagged or unchecked');
 await expect(page.locator('path.leaflet-interactive[stroke="#b45309"]')).toHaveCount(0);
 await page.getByRole('checkbox',{name:/Show flagged/}).check();
 const marker=page.locator('path.leaflet-interactive[stroke="#b45309"]');
 await expect(marker).toHaveCount(1);await marker.click();
 await expect(page.locator('.leaflet-popup')).toContainText('ON_LAND');
 await expect(page.locator('.leaflet-popup')).toContainText('land-fixture');
 await expect(page.locator('.leaflet-popup')).toContainText('21.1000, 70.6000');
 await page.getByRole('button',{name:'Clear Selection',exact:true}).click();
 await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(0);
 await expect(page.locator('.leaflet-popup')).toHaveCount(0);
 await expect(page.locator('.leaflet-tooltip')).toHaveCount(0);
 await expect(page.locator('.leaflet-container')).toBeVisible();
 await expect(page.locator('.leaflet-tile-pane')).toHaveCount(1);
 onlyLand=true;
 await page.getByRole('checkbox',{name:/Show flagged/}).uncheck();
 await page.getByRole('button',{name:'Load data',exact:true}).click();
 await expect(page.locator('.evidence-card.obis')).toContainText('Locations flagged on land');
 await expect(page.locator('.evidence-card.obis')).not.toContainText('records shown');
 await expect(page.locator('path.leaflet-interactive[stroke="#7c3aed"]')).toHaveCount(0);
 await expect(page.locator('path.leaflet-interactive[stroke="#b45309"]')).toHaveCount(0);
 await page.locator('.evidence-card.obis summary').click();
 await expect(page.locator('.evidence-card.obis')).toContainText('1 raw records loaded; 0 eligible for the default map');
 console.log('PASS: flagged records hidden by default, opt-in amber marker, original coordinates and QC provenance visible. Fixtures only.');
} finally {await browser.close();}
