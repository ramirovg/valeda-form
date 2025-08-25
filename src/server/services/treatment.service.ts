import { Treatment, ITreatment } from '../models/treatment.model';
import { FilterQuery, SortOrder } from 'mongoose';

// Search filters interface
export interface SearchFilters {
  name?: string;
  doctor?: string;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
  treatmentType?: string;
}

// Pagination options
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search result interface
export interface SearchResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export class TreatmentService {
  /**
   * Get all treatments with optional pagination
   */
  static async getAllTreatments(options: PaginationOptions = {}): Promise<SearchResult<ITreatment>> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'lastModified',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const sort: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [treatments, totalItems] = await Promise.all([
      Treatment.find({})
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Treatment.countDocuments({})
    ]);

    return {
      data: treatments as ITreatment[],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: limit
      }
    };
  }

  /**
   * Search treatments by filters
   */
  static async searchTreatments(
    filters: SearchFilters,
    options: PaginationOptions = {}
  ): Promise<SearchResult<ITreatment>> {
    const query: FilterQuery<ITreatment> = {};

    // Build search query
    if (filters.name) {
      query['patient.name'] = new RegExp(filters.name, 'i');
    }

    if (filters.doctor) {
      query['doctor.name'] = new RegExp(filters.doctor, 'i');
    }

    if (filters.treatmentType) {
      query.treatmentType = filters.treatmentType;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.creationDate = {};
      if (filters.dateFrom) {
        query.creationDate.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.creationDate.$lte = filters.dateTo;
      }
    }

    const {
      page = 1,
      limit = 50,
      sortBy = 'lastModified',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const sort: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [treatments, totalItems] = await Promise.all([
      Treatment.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Treatment.countDocuments(query)
    ]);

    return {
      data: treatments as ITreatment[],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: limit
      }
    };
  }

  /**
   * Get treatment by ID
   */
  static async getTreatmentById(id: string): Promise<ITreatment | null> {
    try {
      const treatment = await Treatment.findById(id).lean();
      return treatment as ITreatment;
    } catch (error) {
      console.error(`Error finding treatment ${id}:`, error);
      return null;
    }
  }

  /**
   * Create new treatment
   */
  static async createTreatment(treatmentData: Partial<ITreatment>): Promise<ITreatment> {
    try {
      const treatment = new Treatment(treatmentData);
      await treatment.save();

      console.log('🏥 Created new treatment:', {
        id: treatment.id,
        patient: treatment.patient.name,
        doctor: treatment.doctor.name,
        sessionsCount: treatment.sessions.length
      });

      return treatment;
    } catch (error) {
      console.error('Error creating treatment:', error);
      throw error;
    }
  }

  /**
   * Update existing treatment
   */
  static async updateTreatment(id: string, updateData: Partial<ITreatment>): Promise<ITreatment | null> {
    try {
      const treatment = await Treatment.findByIdAndUpdate(
        id,
        { ...updateData, lastModified: new Date() },
        { new: true, runValidators: true }
      );

      if (treatment) {
        console.log('💾 Updated treatment:', {
          id: treatment.id,
          patient: treatment.patient.name,
          sessionsWithData: treatment.sessions.filter(s => s.technician || s.time || s.date).length
        });
      }

      return treatment;
    } catch (error) {
      console.error(`Error updating treatment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete treatment
   */
  static async deleteTreatment(id: string): Promise<boolean> {
    try {
      const result = await Treatment.findByIdAndDelete(id);

      if (result) {
        console.log('🗑️ Deleted treatment:', {
          id: result.id,
          patient: result.patient.name
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error deleting treatment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get treatment statistics
   */
  static async getStatistics(): Promise<{
    totalTreatments: number;
    treatmentsByType: Record<string, number>;
    completedSessions: number;
    averageSessionsPerTreatment: number;
  }> {
    try {
      const [
        totalTreatments,
        treatmentsByType,
        treatments
      ] = await Promise.all([
        Treatment.countDocuments(),
        Treatment.aggregate([
          { $group: { _id: '$treatmentType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Treatment.find({}, 'sessions').lean()
      ]);

      const typeStats = treatmentsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>);

      const completedSessions = treatments.reduce((total, treatment) => {
        return total + treatment.sessions.filter((s: any) => s.date).length;
      }, 0);

      const averageSessionsPerTreatment = totalTreatments > 0
        ? Math.round((completedSessions / totalTreatments) * 100) / 100
        : 0;

      return {
        totalTreatments,
        treatmentsByType: typeStats,
        completedSessions,
        averageSessionsPerTreatment
      };
    } catch (error) {
      console.error('Error getting treatment statistics:', error);
      throw error;
    }
  }

  /**
   * Initialize sessions for new treatment
   */
  static initializeSessions() {
    return Array.from({ length: 9 }, (_, index) => ({
      sessionNumber: index + 1,
      technician: '',
      time: ''
    }));
  }
}
