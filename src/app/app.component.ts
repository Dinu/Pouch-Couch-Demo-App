import { Component ,Input, OnInit} from '@angular/core';

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
export class AppComponent implements OnInit {

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

    this.ldb.sync(this.rdb).on('complete', function () {
      console.log('sucessfully synced from ldb')
    }).on('error', function (err:any) {
      console.log(err)
    });
                  
  }

  ngOnInit(): void {

    this.doc._id = '003'

    if(navigator.onLine === true){
      console.log('Intially online')
      this.intitialDatafromDB(this.rdb)
    }
    else{
      console.log('Intially offline')
      this.intitialDatafromDB(this.ldb)
    }

    // this.ldb.destroy().then(function (response:any) {
    //   // success
    // }).catch(function (err:any) {
    //   console.log(err);
    // });

    // this.rdb.destroy().then(function (response) {
    //   // success
    // }).catch(function (err) {
    //   console.log(err);
    // });

  }


  addNewsEvent(text:any){
  
    this.data.push(text.value)
    this.doc.content = this.data
    text.value = ''
 
    console.log(this.doc)
    
    if(navigator.onLine === true){
      console.log('online at addnews')
      this.updateDB(this.rdb)
    }
    else{
      console.log('offline at addnews')
      this.updateDB(this.ldb)
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

  updateDB(db:any){

    db.get('003').then((doc1:docConfig) => {
      doc1.content = this.doc.content
      db.put(doc1)
    }).catch((err:any) => {
      console.log(err)
    })
  
  }

}

