import { Request, Response } from 'express';
import { TreatmentService, SearchFilters, PaginationOptions } from '../services/treatment.service';
import { ITreatment } from '../models/treatment.model';

export class TreatmentController {
  /**
   * GET /api/treatments - Get all treatments (with optional search filters)
   */
  static async getAllTreatments(req: Request, res: Response): Promise<void> {
    try {
      // Check if any search filters are present
      const hasSearchFilters = req.query['name'] || req.query['doctor'] || req.query['treatmentType'] || req.query['dateFrom'] || req.query['dateTo'];

      const paginationOptions: PaginationOptions = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 50,
        sortBy: req.query['sortBy'] as string || 'lastModified',
        sortOrder: (req.query['sortOrder'] as 'asc' | 'desc') || 'desc'
      };

      let result;

      if (hasSearchFilters) {
        // Use search functionality if filters are present
        const searchFilters: SearchFilters = {
          name: req.query['name'] as string,
          doctor: req.query['doctor'] as string,
          treatmentType: req.query['treatmentType'] as string,
          dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined,
          dateTo: req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined
        };

        // Remove undefined values
        Object.keys(searchFilters).forEach(key => {
          if (searchFilters[key as keyof SearchFilters] === undefined) {
            delete searchFilters[key as keyof SearchFilters];
          }
        });

        console.log('🔍 Searching treatments with filters:', searchFilters);
        result = await TreatmentService.searchTreatments(searchFilters, paginationOptions);
      } else {
        // Return all treatments if no filters
        result = await TreatmentService.getAllTreatments(paginationOptions);
      }

      // Disable caching for search results to prevent 304 responses
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json(result);
    } catch (error) {
      console.error('Error getting treatments:', error);
      res.status(500).json({ 
        error: 'Failed to load treatments',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/treatments/search - Search treatments
   */
  static async searchTreatments(req: Request, res: Response): Promise<void> {
    try {
      const searchFilters: SearchFilters = {
        name: req.query['name'] as string,
        doctor: req.query['doctor'] as string,
        treatmentType: req.query['treatmentType'] as string,
        dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined,
        dateTo: req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined
      };

      // Remove undefined values
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key as keyof SearchFilters] === undefined) {
          delete searchFilters[key as keyof SearchFilters];
        }
      });

      const paginationOptions: PaginationOptions = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 50,
        sortBy: req.query['sortBy'] as string || 'lastModified',
        sortOrder: (req.query['sortOrder'] as 'asc' | 'desc') || 'desc'
      };

      const result = await TreatmentService.searchTreatments(searchFilters, paginationOptions);
      res.json(result);
    } catch (error) {
      console.error('Error searching treatments:', error);
      res.status(500).json({ 
        error: 'Failed to search treatments',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/treatments/:id - Get treatment by ID
   */
  static async getTreatmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const treatment = await TreatmentService.getTreatmentById(id);
      
      if (!treatment) {
        res.status(404).json({ error: 'Treatment not found' });
        return;
      }
      
      res.json(treatment);
    } catch (error) {
      console.error('Error getting treatment:', error);
      res.status(500).json({ 
        error: 'Failed to load treatment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/treatments - Create new treatment
   */
  static async createTreatment(req: Request, res: Response): Promise<void> {
    try {
      const treatmentData = req.body as Partial<ITreatment>;
      
      // Validate required fields
      if (!treatmentData.patient?.name || !treatmentData.doctor?.name || !treatmentData.treatmentType) {
        res.status(400).json({ 
          error: 'Missing required fields',
          required: ['patient.name', 'doctor.name', 'treatmentType']
        });
        return;
      }

      // Initialize sessions if not provided
      if (!treatmentData.sessions || treatmentData.sessions.length === 0) {
        treatmentData.sessions = TreatmentService.initializeSessions();
      }

      const treatment = await TreatmentService.createTreatment(treatmentData);
      res.status(201).json(treatment);
    } catch (error) {
      console.error('Error creating treatment:', error);
      
      if (error instanceof Error && error.name === 'ValidationError') {
        res.status(400).json({ 
          error: 'Validation failed',
          details: error.message
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to create treatment',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * PUT /api/treatments/:id - Update treatment
   */
  static async updateTreatment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body as Partial<ITreatment>;
      
      const treatment = await TreatmentService.updateTreatment(id, updateData);
      
      if (!treatment) {
        res.status(404).json({ error: 'Treatment not found' });
        return;
      }
      
      res.json(treatment);
    } catch (error) {
      console.error('Error updating treatment:', error);
      
      if (error instanceof Error && error.name === 'ValidationError') {
        res.status(400).json({ 
          error: 'Validation failed',
          details: error.message
        });
      } else if (error instanceof Error && error.name === 'CastError') {
        res.status(400).json({ 
          error: 'Invalid treatment ID format'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to update treatment',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * DELETE /api/treatments/:id - Delete treatment
   */
  static async deleteTreatment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await TreatmentService.deleteTreatment(id);
      
      if (!success) {
        res.status(404).json({ error: 'Treatment not found' });
        return;
      }
      
      res.json({ message: 'Treatment deleted successfully' });
    } catch (error) {
      console.error('Error deleting treatment:', error);
      
      if (error instanceof Error && error.name === 'CastError') {
        res.status(400).json({ 
          error: 'Invalid treatment ID format'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to delete treatment',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * GET /api/treatments/statistics - Get treatment statistics
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await TreatmentService.getStatistics();
      res.json(statistics);
    } catch (error) {
      console.error('Error getting treatment statistics:', error);
      res.status(500).json({ 
        error: 'Failed to get treatment statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}