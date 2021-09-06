import { Component ,Input } from '@angular/core';

import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
PouchDB.plugin(PouchDBFind);

type docConfig = {
  _id:string
  content:string[]
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'pouchApp';

  ldb:any = new PouchDB('local')

  doc:docConfig = <docConfig>{}

  rdb = new PouchDB('http://localhost:5984/r', {
          fetch: function (url, opts:any) {
            opts.headers.set('X-Auth-CouchDB-Roles', '_admin');
            return PouchDB.fetch(url, opts);
          }
  });


  @Input() data:string[] = []

  constructor(){

    this.doc._id = '003'
    this.sync()
    this.statusCheck()
                  
  }


  sync(){

    this.ldb.sync(this.rdb).on('complete', function () {
      console.log('sucessfully synced')
    }).on('error', function (err:any) {
      console.log(err)
    });

  }

  statusCheck(){

    if(navigator.onLine === true){
      console.log('Intially online')
      this.intitialDatafromDB(this.rdb)
    }
    else{
      console.log('Intially offline')
      this.intitialDatafromDB(this.ldb)
    }

  }

  addNewsEvent(text:any){
    
    if(navigator.onLine === true){
      console.log('online at addnews')
      this.updateDB(this.rdb,text)
    }
    else{
      console.log('offline at addnews')
      this.updateDB(this.ldb,text)
    }

  }

  intitialDatafromDB(db:any){

    db.get('003').then((doc1:docConfig) => {
      this.doc = doc1
      this.data = doc1.content
    }).catch((err:any) => {
      this.data = []
      this.doc.content = this.data
      db.put(this.doc)
      console.log(err)
    })
    
  }


  updateDB(db:any,text:any){

    db.get('003').then((doc1:docConfig) => {
      doc1.content.push(text.value)
      console.log(doc1.content)
      text.value = ''
      db.put(doc1).then(()=>{this.sync()})
    }).catch((err:any) => {
      console.log(err)
    })
  }

  changes_ldb = this.ldb.changes({
    since: 'now',
    live: true,
    include_docs: true
    }).on('change', (change:any) => {
      this.data = change.doc.content
    }).on('error', function (err:any) {
      console.log(err);
  });


  changes_rdb = this.rdb.changes({
    since: 'now',
    live: true,
    include_docs: true
    }).on('change', (change:any) => {
      this.data = change.doc.content
    }).on('error', function (err:any) {
      console.log(err);
  });

}



