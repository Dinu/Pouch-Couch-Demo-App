import { ApplicationRef, Component ,Input } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';


import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import { interval } from 'rxjs';
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

  @Input() data:any = []
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
            opts.headers.set('X-Auth-CouchDB-UserName', 'admin');
            opts.headers.set('X-Auth-CouchDB-Token', 'e3fe35d3d979846aa9b79f1b1c4394aaffd8d768');
            return PouchDB.fetch(url, opts);
          }
  });

  constructor(updates:SwUpdate, appRef:ApplicationRef){

    if(navigator.onLine === true){
      console.log('Intially online')
      this.intitialDatafromDB(this.rdb)
    }
    else{
      console.log('Intially offline')
     this.intitialDatafromDB(this.ldb)
    }

    this.onlineListen = window.addEventListener('online', this.sync);

    updates.available.subscribe(event => {
      console.log('current version is', event.current)
      console.log('available version is', event.available)
      if(confirm('update available')){
      updates.activateUpdate().then(() => location.reload())
      }
    })

    updates.activated.subscribe(event => {
      console.log('old version was', event.previous)
      console.log('new version is', event.current)
    })

    appRef.isStable.subscribe((isStable) => {
      if(isStable){
        const timeInt = interval(20000)
        timeInt.subscribe(()=>{
          updates.checkForUpdate().then(() => console.log('checked'))
          console.log('update checked')
        })
      }
    } )

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

    db.find({

      selector: { 
        timestamp: { $gt:null  },
      },
      sort:[{'timestamp':'desc'}],
      fields:['news']
    
    }).then( (result:any) => {
      this.data = result.docs
      console.log(result.docs)
    }).catch( (err:any) => {
      this.createIndex(db)
      console.log(err);
    });


  }

  createIndex(db:any){

    db.createIndex({
      index: {fields: ['timestamp'],
    }
    }).then(() => {
      this.intitialDatafromDB(db)
    })

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

    db.find({
      sort:[{'upVote':'desc'}],
      selector: { 
        upVote:{ $gte: 7 }
      },
      fields:['news','upVote'],
      limit:5
    
    }).then( (result:any) => {
      this.upVotedData = result.docs
      console.log(result.docs)
    }).catch( (err:any) => {
      this.createIndexUpVote(db)
      console.log(err);
    });

  }

  createIndexUpVote(db:any){

    db.createIndex({
      index: {fields: ['upVote']}
    }).then(() => {
      this.upVotedNewsEvent(db)
    })

  }


  latestNewsEvent(db:any){

    db.find({
      selector: { 
        timestamp: { $gt:null  },
      },
      sort:[{'timestamp':'desc'}],
      fields:['news'],
      limit:5

    }).then( (result:any) => {
      this.latestNewsData = result.docs
      console.log(result.docs)
    }).catch( (err:any) => {
      this.createIndex(db)
      console.log(err);
    });

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

//**************************************************************************************************

// By using view method

/*

  intitialDatafromDB(db:any){

    db.query('allDocView',{descending:true}).then( (result:any) => {
      this.data = result.rows
    }).catch( (err:any) => {
      this.allDocView(db)
      console.log(err);
    });
    
  }

  allDocView(db:any){

    let emit:any
    let currentTime:number

    let ddoc = {
      _id: '_design/allDocView',
      views: {
        allDocView: {
          map: function(doc:any) {

              emit(doc.timestamp,doc.news)
            
          }.toString()
        }
      }
    }
    
    
    db.put(ddoc).catch(function (err:any) {
      if (err.name !== 'conflict') {
        throw err;
      }
    }).then( () => {
      this.intitialDatafromDB(db)
    }).catch(function (err:any) {
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

    db.query('upVoteNewsView',{descending:true,limit:5}).then( (result:any) => {
      this.upVotedData = result.rows
    }).catch( (err:any) => {
      this.upVoteNewsView(db)
      console.log(err);
    });

  }


  latestNewsEvent(db:any){

    db.query('allDocView',{descending:true ,limit:5}).then( (result:any) => {
      this.latestNewsData = result.rows
    }).catch( (err:any) => {
      console.log(err);
    });

  }

  

  upVoteNewsView(db:any){

    let emit:any

    let ddoc = {
      _id: '_design/upVoteNewsView',
      views: {
        upVoteNewsView: {
          map: function(doc:any) {
            if(doc.upVote >= 7 ){
              emit(doc.upVote,doc.news)
            }
          }.toString()
        }
      }
    }
    
    
    db.put(ddoc).catch(function (err:any) {
      if (err.name !== 'conflict') {
        throw err;
      }
    }).then( () => {
      this.upVotedNewsEvent(db)
    }).catch(function (err:any) {
      console.log(err);
    });

  }

















































  //******************************************************************************************************************* 


  // Bu using Index method

  /*


   intitialDatafromDB(db:any){

    db.find({

      selector: { 
        timestamp: { $gt:null  },
      },
      sort:[{'timestamp':'desc'}],
      fields:['news']
    
    }).then( (result:any) => {
      this.data = result.docs
      console.log(result.docs)
    }).catch( (err:any) => {
      this.createIndex(db)
      console.log(err);
    });


  }

  createIndex(db:any){

    db.createIndex({
      index: {fields: ['timestamp'],
    }
    }).then(() => {
      this.intitialDatafromDB(db)
    })

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

    db.find({
      sort:[{'upVote':'desc'}],
      selector: { 
        upVote:{ $gte: 7 }
      },
      fields:['news','upVote'],
      limit:5
    
    }).then( (result:any) => {
      this.upVotedData = result.docs
      console.log(result.docs)
    }).catch( (err:any) => {
      this.createIndexUpVote(db)
      console.log(err);
    });

  }

  createIndexUpVote(db:any){

    db.createIndex({
      index: {fields: ['upVote']}
    }).then(() => {
      this.upVotedNewsEvent(db)
    })

  }


  latestNewsEvent(db:any){

    db.find({
      selector: { 
        timestamp: { $gt:null  },
      },
      sort:[{'timestamp':'desc'}],
      fields:['news'],
      limit:5

    }).then( (result:any) => {
      this.latestNewsData = result.docs
      console.log(result.docs)
    }).catch( (err:any) => {
      this.createIndex(db)
      console.log(err);
    });

  }





  */

