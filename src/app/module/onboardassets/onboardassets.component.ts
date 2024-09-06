import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FileSystemDirectoryEntry, FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from 'src/app/shared/services/account.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { NftService } from 'src/app/shared/services/nft.service';
import { OnboardAssetService } from 'src/app/shared/services/onboard-asset.service';
import { WebStorageService } from 'src/app/shared/services/web-storage.service';

@Component({
    selector: 'app-onboardassets',
    templateUrl: './onboardassets.component.html',
    styleUrls: ['./onboardassets.component.css']
})
export class OnboardassetsComponent implements OnInit {

    account: any;
    assetFormSubmitted: boolean = false;
    assetForm: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        brand: ['', Validators.required],
        model: ['', Validators.required],
        custody_destination: ['', Validators.required],
        description: ['', Validators.required],
        provenance_documents: ['', Validators.required],
        media: ['', Validators.required]
    });
    assetFormProcessing: boolean = false;
    nftTraits: any[] = [];
    regulated: boolean = false;
    user: any;
    showoverlay: boolean = false;
    document: any
    constructor(
        private fb: FormBuilder,
        private webStorageService: WebStorageService,
        private toastr: ToastrService,
        private nftService: NftService,
        private commonService: CommonService,
        private onBoardAssetService: OnboardAssetService,
        private router: Router,
        private accountService: AccountService
    ) { }

    ngOnInit() {
        this.account = this.webStorageService.getLocalStorage('account') != null ? JSON.parse(this.webStorageService.getLocalStorage('account') || '') : this.account;
        this.user = this.webStorageService.getLocalStorage('user') != null ? JSON.parse(this.webStorageService.getLocalStorage('user') || 'undefined') : this.user;
        this.regulated = JSON.parse(this.webStorageService.getLocalStorage('regulated') || 'true');
        this.commonService.setTabEmitter({ type: 'dashboard' });
        this.getAllTraits();
        this.commonService.showmodaloverlayObservable.subscribe((response: boolean) => this.showoverlay = response)
    }
    closeOverlay() {
        this.showoverlay = false;
        this.commonService.setOverlay(false)
    }
    getAllTraits() {
        this.nftService.getNftTriats().subscribe((response: any) => {
            let locationAttributes = response.data.find((item: any) => item.attribute === 'Location')
            this.nftTraits = locationAttributes.value;
        });
    }

    get assetFormControls() {
        return this.assetForm.controls;
    }

    async onboardNewAsset() {
        this.assetFormSubmitted = true;
        this.assetFormProcessing = true;
        if (this.assetForm.valid) {
            let provenanceFile = await this.onFileSelected(this.files);
            this.assetForm.patchValue({ provenance_documents: this.splitFileUrl(provenanceFile) });
            let media = await this.onFileSelected(this.mediafiles);
            this.assetForm.patchValue({ media: this.splitFileUrl(media) });

            let params = {
                ...this.assetForm.value,
                wallet_address: this.account?.walletAddress
            }
            this.onBoardAssetService.onBoardAsset(params).subscribe((response: any) => {
                this.toastr.success('Asset onboarded successfully.');
                this.assetFormSubmitted = false;
                this.assetFormProcessing = false;
                this.assetForm.reset();
                this.router.navigate(['/'])
            });
        } else {
            this.assetFormProcessing = false;
        }

    }

    async onFileSelected(files: any) {
        for (let index = 0; index < files.length; index++) {
            const file: File = files[index].fileEntry;
            const isValidImage = this.commonService.imageMimeTypeValidation(file.name);
            if (!isValidImage) {
                this.toastr.error('File not supported.');
                return;
            }
        }
        const filesArray: any = Array.from(files);
        const formData = new FormData();
        for (let file of filesArray) {
            const fileEntry = file.fileEntry as FileSystemFileEntry;
            fileEntry.file((file: File) => {
                formData.append('file', file);
            });
        }

        let response: any = await this.commonService.uploadImage(formData);
        return response.data.file
    }

    splitFileUrl(data: any) {
        let urls = [];
        for (let index = 0; index < data.length; index++) {
            urls.push(data[index].Url);
        }
        return urls;
    }

    connectWallet() {
        this.accountService.enableMetaMaskConnection(true);
    }
    /***
     * file upload
     */
    public files: NgxFileDropEntry[] = [];
    public mediafiles: NgxFileDropEntry[] = [];
    public dropped(files: NgxFileDropEntry[]) {
        this.files = files;
        this.assetForm.patchValue({ provenance_documents: this.files });
    }

    public droppedMedia(mediafiles: NgxFileDropEntry[]) {
        this.mediafiles = mediafiles;
        this.assetForm.patchValue({ media: this.mediafiles });
    }

    setRoute() {
        this.webStorageService.setItem('previousRoute', this.router.url)
    }

}
