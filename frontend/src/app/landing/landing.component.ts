import { Component, OnInit, HostListener } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import {
  BookService,
  Resource,
  ResourceType,
} from '../core/services/book.service';
import { ImageService } from '../core/services/image.service';

interface CarouselData {
  resources: Resource[];
  displayedResources: Resource[];
  currentPage: number;
  totalPages: number;
  title: string;
}

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
],
})
export class LandingComponent implements OnInit {
  resourcesByType: Map<ResourceType, CarouselData> = new Map();
  resourceTypes = Object.values(ResourceType);
  loading = true;
  error = false;
  itemsPerPage = 3;
  currentScreenWidth: number = window.innerWidth;

  constructor(
    private bookService: BookService,
    public imageService: ImageService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const newScreenWidth = event.target.innerWidth;

    // Ne réinitialiser les carrousels que si la catégorie de taille d'écran change
    const oldScreenSizeCategory = this.getScreenSizeCategory(
      this.currentScreenWidth
    );
    const newScreenSizeCategory = this.getScreenSizeCategory(newScreenWidth);

    if (oldScreenSizeCategory !== newScreenSizeCategory) {
      this.currentScreenWidth = newScreenWidth;
      this.updateItemsPerPage();
      this.resetCarousels();
    }
  }

  private getScreenSizeCategory(width: number): string {
    if (width < 576) return 'xs';
    if (width < 992) return 'md';
    return 'lg';
  }

  private updateItemsPerPage() {
    if (this.currentScreenWidth < 576) {
      this.itemsPerPage = 1;
    } else if (this.currentScreenWidth < 992) {
      this.itemsPerPage = 2;
    } else {
      this.itemsPerPage = 3;
    }
  }

  private resetCarousels() {
    if (this.resourcesByType.size > 0) {
      this.bookService.getAllResourcesWithCopies().subscribe({
        next: (resources) => {
          this.initializeCarousels(resources);
        },
        error: (error) => {
          console.error('Erreur lors du rechargement des ressources:', error);
        },
      });
    }
  }

  ngOnInit(): void {
    this.updateItemsPerPage();
    this.loadResources();
  }

  private loadResources(): void {
    this.bookService.getAllResourcesWithCopies().subscribe({
      next: (resources) => {
        // Initialiser les carrousels
        this.initializeCarousels(resources);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des ressources:', error);
        this.error = true;
        this.loading = false;
      },
    });
  }

  private initializeCarousels(resources: Resource[]): void {
    // Regrouper les ressources par type
    this.resourceTypes.forEach((type) => {
      const typeResources = resources.filter((r) => r.type === type);

      if (typeResources.length > 0) {
        const totalPages = Math.ceil(typeResources.length / this.itemsPerPage);

        this.resourcesByType.set(type, {
          resources: typeResources,
          displayedResources: typeResources.slice(0, this.itemsPerPage),
          currentPage: 0,
          totalPages: totalPages,
          title: this.getTypeFrenchTitle(type),
        });
      }
    });
  }

  // Méthode pour obtenir le titre français selon le type de ressource
  private getTypeFrenchTitle(type: ResourceType): string {
    switch (type) {
      case ResourceType.BOOK:
        return 'Livres';
      case ResourceType.COMIC:
        return 'Bandes dessinées';
      case ResourceType.DVD:
        return 'Films et DVD';
      case ResourceType.GAME:
        return 'Jeux vidéo';
      case ResourceType.MAGAZINE:
        return 'Magazines';
      case ResourceType.AUDIOBOOK:
        return 'Livres audio';
      default:
        return 'Ressources';
    }
  }

  // Méthodes pour gérer le carrousel pour un type spécifique
  nextPage(type: ResourceType): void {
    const carousel = this.resourcesByType.get(type);
    if (carousel && carousel.currentPage < carousel.totalPages - 1) {
      carousel.currentPage++;
      this.updateDisplayedResources(type);
    }
  }

  previousPage(type: ResourceType): void {
    const carousel = this.resourcesByType.get(type);
    if (carousel && carousel.currentPage > 0) {
      carousel.currentPage--;
      this.updateDisplayedResources(type);
    }
  }

  updateDisplayedResources(type: ResourceType): void {
    const carousel = this.resourcesByType.get(type);
    if (carousel) {
      const startIndex = carousel.currentPage * this.itemsPerPage;
      carousel.displayedResources = carousel.resources.slice(
        startIndex,
        startIndex + this.itemsPerPage
      );
    }
  }

  // Vérifier si on peut naviguer aux pages précédente/suivante
  canGoToPreviousPage(type: ResourceType): boolean {
    const carousel = this.resourcesByType.get(type);
    return carousel ? carousel.currentPage > 0 : false;
  }

  canGoToNextPage(type: ResourceType): boolean {
    const carousel = this.resourcesByType.get(type);
    return carousel ? carousel.currentPage < carousel.totalPages - 1 : false;
  }

  // Méthode pour vérifier si un type de ressource a des éléments
  hasResources(type: ResourceType): boolean {
    return (
      this.resourcesByType.has(type) &&
      this.resourcesByType.get(type)!.resources.length > 0
    );
  }

  /**
   * Obtenir l'URL complète de l'image depuis Supabase
   */
  getResourceCoverUrl(coverImageUrl: string | undefined): string {
    return this.imageService.getSafeImageUrl(coverImageUrl || '');
  }

  /**
   * Gérer les erreurs de chargement d'image
   */
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.imageService.getSafeImageUrl('');
    }
  }
}
