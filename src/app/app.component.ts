import { Component ,Input } from '@angular/core';

import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
PouchDB.plugin(PouchDBFind);



type docConfig = {
  _id:string
  timestamp:number
  news:string
  upVote:number
}

type dataconfig = {
    id:string
    key:string
    value:{'rev':string}
    doc:docConfig
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'pouchApp';

  @Input() data:dataconfig[] = []
  @Input() upVotedData:any = []
  @Input() latestNewsData:any = []
 
 
  ldb:any = new PouchDB('local')

  onlineListen: any;

  doc:docConfig = <docConfig>{}

  latestNewsBool:boolean = false;

  upVotedNewsBool:boolean = false;

  currentTime:number = 0

  heading:string = ''

  rdb = new PouchDB('http://localhost:5984/r2', {
          fetch: function (url, opts:any) {
            opts.headers.set('X-Auth-CouchDB-Roles', '_admin');
            return PouchDB.fetch(url, opts);
          }
  });

  constructor(){

    if(navigator.onLine === true){
      console.log('Intially online')
      this.intitialDatafromDB(this.rdb)
    }
    else{
      console.log('Intially offline')
     this.intitialDatafromDB(this.ldb)
    }

    this.onlineListen = window.addEventListener('online', this.sync);

  }


  sync = () => {

    this.ldb.sync(this.rdb).on('complete', function () {
      console.log('sucessfully synced')
    }).on('error', function (err:any) {
      console.log(err)
    });

  }

  addNewsEvent(text:any, voteIn:any){
    
    if(navigator.onLine === true){
      console.log('online at addnews')
      this.updateDB(this.rdb,text,voteIn)
    }
    else{
      console.log('offline at addnews')
      this.updateDB(this.ldb,text,voteIn)
    }

  }

  intitialDatafromDB(db:any){

    db.allDocs({
      include_docs: true,
      attachments: true
    }).then( (result:any) => {
      this.data = result.rows
      console.log(result)
    }).catch( (err:any) => {
      this.data = []
      console.log(err);
    });
    
  }


  updateDB(db:any,text:any,voteIn:any){

    this.doc._id = Math.floor(new Date().getTime()/1000 ).toString()
    this.doc.news = text.value
    this.doc.timestamp = Math.floor(new Date().getTime()/1000 )
    this.doc.upVote = Number(voteIn.value)

    text.value = ''
    voteIn.value = ''

    db.put(this.doc).then(()=>{

      if(navigator.onLine === true){
        console.log('updateDB online')
        this.sync()
      }
      else{
        console.log('updateDB offline')
        this.intitialDatafromDB(this.ldb)
      }
      }).catch((err:any) => {
        console.log(err)
    })

  }

  changes_rdb = this.rdb.changes({
    since: 'now',
    live: true,
    include_docs: true
    }).on('change', (change:any) => {
      this.data = change.doc.content
      this.intitialDatafromDB(this.rdb)
      this.heading = 'The News Content'
      this.sync()
      console.log(change)
    }).on('error', (err:any) => {
      console.log(err)
  })

  latestNews(){

    this.latestNewsBool = ! this.latestNewsBool
    this.upVotedNewsBool = false

    if(navigator.onLine === true && this.latestNewsBool === true){
      this.latestNewsEvent(this.rdb)
    }
    else if(this.latestNewsBool === true){
      this.latestNewsEvent(this.ldb)
    }

  }

  upVotedNews(){

    this.upVotedNewsBool = ! this.upVotedNewsBool
    this.latestNewsBool = false

    if(navigator.onLine === true && this.upVotedNewsBool === true){
      this.upVotedNewsEvent(this.rdb)
    }
    else if(this.upVotedNewsBool === true){
      this.upVotedNewsEvent(this.ldb)
    }

  }

  upVotedNewsEvent(db:any){

    // db.find({
    //   selector: {upVote: { $gte: 6 } },
    //   sort: ['upVote'],
    //   limit:5,
    // }).then( (result:any) => {
    //   console.log(result)
    // }).catch( (err:any) => {
    //   console.log(err);
    //   db.createIndex({
    //     index: {fields: ['upVote']}
    //   }).then(() => { this.upVotedNewsEvent(db)})

    // });

    this.ldb.query(this.mapUpVote,{descending:false,limit:5}).then( (result:any) => {
      console.log(result)
      this.upVotedData = result.rows
    }).catch(function (err:any) {
      console.log(err);
    });


  }

  mapUpVote = (doc:any,emit:any) => {

    if(doc.upVote >= 7 ){

      emit([doc.news])

    }
 
  }

  latestNewsEvent(db:any){

    this.ldb.query(this.mapLatest,{descending:true ,limit:5}).then( (result:any) => {
      console.log(result)
      this.latestNewsData = result.rows
    }).catch(function (err:any) {
      console.log(err);
    });

  }

  mapLatest = (doc:any,emit:any) => {

    this.currentTime = Math.floor(new Date().getTime()/1000 ) 

    if(doc.timestamp < this.currentTime && doc.timestamp > this.currentTime-86400){
      emit([doc.news])
    }


  }


}

// 86400000









// TN seeks 1 crore more Covid vaccine doses from Centre
// 15 districts in Tamil Nadu report marginal increase in fresh Covid infections
// Govt urged to speed up power supply for agriculture sector
// Nipah virus: Screening tightened at 13 check posts along Tamil Nadu
// Tamil Nadu: No more toll on OMR, yet cabs charge extra
// Covid cuts Tamil Nadu Right to Education admissions by 29%
// State Election Commission to hold all-party meet to discuss Tamil Nadu local polls
// Only native bulls to be allowed in Jallikattu: Madras HC bars participation of foreign breeds
// Senior nuclear scientist Dr Balasubramanian Venkatraman is new Director of IGCAR
// Tamil Nadu coast on high alert owing to possible LTTE-drug syndicate threat