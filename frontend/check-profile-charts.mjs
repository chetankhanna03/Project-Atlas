import {chromium, expect} from '@playwright/test';
const browser = await chromium.launch({channel:'msedge', headless:true});
try {
 const page = await browser.newPage();
 const deep = {float_id:'fixture',cycle:12,time:'2026-09-01T00:00:00Z',latitude:15,longitude:65,parameter:'temperature',unit:'degree_Celsius',levels:[{pressure_dbar:2000,value:3},{pressure_dbar:1,value:29}]};
 const shallow = {...deep,levels:[{pressure_dbar:1,value:29},{pressure_dbar:20,value:28.99}]};
 await page.route('**/api/**',route=>route.fulfill({json:route.request().url().includes('/argo/gdac') ? {status:'ok',profiles:[deep,deep,shallow,{...deep,levels:[{pressure_dbar:1,value:29}]}]} : {status:'no_data',sources:[],results:[]}}));
 await page.goto('http://127.0.0.1:3000');
 await page.getByRole('button',{name:'Explore',exact:true}).click();
 await page.getByRole('button',{name:'Load data',exact:true}).click();
 await expect(page.getByRole('img',{name:'Float fixture: temperature · cycle 12',exact:true})).toHaveCount(1);
 await expect(page.getByText('Vertical axis: °C.',{exact:false}).first()).toBeVisible();
 await page.getByText('View 1 additional distinct profiles / series',{exact:true}).click();
 await expect(page.getByRole('img',{name:'Float fixture: temperature · cycle 12',exact:true})).toHaveCount(2);
 await expect(page.getByText('Span: 0.010 °C.',{exact:false})).toBeVisible();
 console.log('PASS: duplicate and one-point charts omitted; distinct shallow profile expandable; axes and small variation labelled. Synthetic fixtures.');
} finally { await browser.close(); }
