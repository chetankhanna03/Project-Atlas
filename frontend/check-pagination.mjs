import {chromium, expect} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}}), requests=[], errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{
  const u=new URL(route.request().url()); requests.push(u);
  let data={sources:[],documents:[],status:'no_data',results:[],profiles:[]};
  if(u.pathname.endsWith('/obis')) {
   const second=u.searchParams.has('after');
   data={status:'ok',results:Array.from({length:second?5:100},(_,i)=>({record_id:String(i+(second?100:0)),scientific_name:'Synthetic browser fixture',latitude:15,longitude:65})),total_matching:105,next_cursor:second?null:'99',limitations:[]};
  }
  if(u.pathname.endsWith('/argo/gdac')) {
   const second=u.searchParams.has('offset');
   data={status:'no_data',profiles:[],files_scanned:second?2:3,matching_files:5,next_offset:second?null:3,errors:[],limitations:[]};
  }
  await route.fulfill({json:data});
 });
 await page.goto('http://127.0.0.1:3000');
 await page.getByRole('button',{name:'Explore',exact:true}).click();
 await expect(page.getByText('100 records shown',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Load more OBIS records',exact:true}).click();
 await expect(page.getByText('105 records shown',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Load more OBIS records',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Load more ARGO profiles',exact:true}).click();
 await expect(page.getByText(/5 files inspected of 5 matching/)).toBeVisible();
 await expect(page.getByRole('button',{name:'Load more ARGO profiles',exact:true})).toHaveCount(0);
 expect(requests.some(u=>u.searchParams.get('after')==='99')).toBe(true);
 expect(requests.some(u=>u.searchParams.get('offset')==='3')).toBe(true);
 expect(errors).toEqual([]);
 console.log('Pagination passed: OBIS grows past 100, ARGO advances past three files, exhausted pages stop. Fixtures only.');
} finally {await browser.close();}
