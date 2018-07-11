import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Gene, GeneNetwork, GeneNode, GeneLink } from '../../../models';

import { GeneService, DataService } from '../../../core/services';
import { ForceService } from '../../../shared/services';

@Component({
    selector: 'gene-network',
    templateUrl: './gene-network.component.html',
    styleUrls: ['./gene-network.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class GeneNetworkComponent implements OnInit {
    @Input() styleClass: string = 'network-panel';
    @Input() style: any;
    @Input() gene: Gene;
    @Input() id: string;
    dataLoaded: boolean = false;
    displayBRDia: boolean = false;
    networkData: GeneNetwork;
    selectedGeneData: GeneNetwork = {
        nodes: [],
        links: [],
        origin: undefined
    };

    private currentGene = this.geneService.getCurrentGene();
    private geneInfo: any;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private geneService: GeneService,
        private dataService: DataService,
        private forceService: ForceService
    ) { }

    ngOnInit() {
        // The data wasn't loaded yet, redirect for now
        if (!this.gene) { this.gene = this.geneService.getCurrentGene(); }
        if (this.geneService.getCurrentInfo()) {
            this.geneInfo = this.geneService.getCurrentInfo();
        } else {
            this.geneInfo = {
                hgnc_symbol: this.selectedGeneData.origin.hgnc_symbol,
                nominatedtarget: [],
                isIGAP: false,
                haseqtl: false
             };
        }
        if (!this.id) { this.id = this.route.snapshot.paramMap.get('id'); }
        if (this.gene && this.forceService.getGeneOriginalList() &&
        this.id !== this.forceService.getGeneOriginalList().origin.ensembl_gene_id) {
            this.loadGenes();
            } else {
                if (this.forceService.getGeneOriginalList()) {
                    const dn = this.forceService.getGeneOriginalList();
                    this.networkData = dn;
                    this.selectedGeneData.nodes = dn.nodes.slice(1);
                    this.selectedGeneData.links = dn.links.slice().reverse();
                    this.selectedGeneData.origin = dn.origin;
                    this.dataLoaded = true;
                    console.log(this.currentGene);
                } else {
                    this.loadGenes();
                }
            }
        console.log(this.geneInfo);
    }

    updategene(event) {
        this.dataService.loadNodes(event).then((datanetwork: any) => {
            this.forceService.processSelectedNode(event, datanetwork).then((network) => {
                this.selectedGeneData.links = network.links;
                this.selectedGeneData.nodes = network.nodes;
                this.selectedGeneData.origin = network.origin;
                this.dataService.getGene(event.id).subscribe((data) => {
                    console.log(data);
                    if (data['geneInfo']) {
                        this.geneInfo = data['geneInfo'];
                    } else {
                        this.geneInfo = { hgnc_symbol: this.selectedGeneData.origin.hgnc_symbol };
                    }
                });
            });
        });
    }

    goToRoute(path: string, outlets?: any) {
        (outlets) ? this.router.navigate([path, outlets], { relativeTo: this.route }) :
            this.router.navigate([path], { relativeTo: this.route });
    }

    loadGenes() {
        this.dataService.loadNodes(this.currentGene).then((data: any) => {
            this.forceService.setData(data);
            this.forceService.processNodes(this.currentGene).then((dn: GeneNetwork) => {
                this.networkData = dn;
                this.selectedGeneData.nodes = dn.nodes.slice(1);
                this.selectedGeneData.links = dn.links.slice().reverse();
                this.selectedGeneData.origin = dn.origin;
                this.dataLoaded = true;
                console.log(this.currentGene);
            });
        });
    }

    viewGene(id: string) {
        this.dataService.getGene(id).subscribe((data) => {
            this.router.routeReuseStrategy.shouldReuseRoute = () => false;
            const currentUrl = this.router.url + '?';
            if (!data['item']) {
                this.router.navigate(['/genes']);
                return;
            }
            this.geneService.setCurrentGene(data['item']);
            this.geneService.setLogFC(data['minFC'], data['maxFC']);
            this.geneService.setAdjPValue(data['minAdjPValue'], data['maxAdjPValue']);
            this.router.navigateByUrl(currentUrl)
                .then(() => {
                    this.router.navigated = false;
                    this.router.navigate(['/genes',
                        {
                            outlets:
                                {
                                'genes-router': ['gene-details', data['item'].ensembl_gene_id]
                                }
                        }]);
                });
        });
    }

    showDialog(dialogString: string) {
        this[dialogString] = true;
    }
}
