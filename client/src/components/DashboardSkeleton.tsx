import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { FoodLoader } from "@/components/FoodLoader";

export function DashboardSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Loading indicator */}
            <div className="flex justify-center items-center py-12">
                <div className="text-center space-y-4">
                    <FoodLoader size="lg" />
                    <p className="text-muted-foreground text-sm">Loading your food items...</p>
                </div>
            </div>
            
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-8 w-12" />
                                </div>
                                <Skeleton className="h-10 w-10 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Items header skeleton */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-7 w-40" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>

            {/* Food items skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-6 w-32" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <Skeleton className="h-8 w-20 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 flex-1" />
                                    <Skeleton className="h-9 flex-1" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
