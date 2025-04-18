import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import config from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

interface MonthlyData {
  month: string;
  count: number;
}

interface OrderStatusData {
  status: string;
  count: number;
}

interface CakeStats {
  name: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
}

interface StatisticsData {
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  totalOrdersPrice: number;
  monthlyData: MonthlyData[];
  orderStatusData: OrderStatusData[];
  topProfitableCakes: CakeStats[];
}

const screenWidth = Dimensions.get("window").width;

const StatisticsScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalOrdersPrice: 0,
    monthlyData: [],
    orderStatusData: [],
    topProfitableCakes: []
  });

  const fetchStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        console.error("No access token found");
        return;
      }
      const response = await fetch(`${config.BASE_URL}/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStatistics();
    }, [fetchStatistics])
  );


  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };
  const statusColors: { [key: string]: string } = {
    delivered: "#4CAF50",
    pending: "#FFC107",
    cancelled: "#F44336"
  };

  const pieChartData = statistics.orderStatusData
    .filter(item => typeof item.count === "number" && isFinite(item.count))
    .map(item => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      population: item.count,
      color: statusColors[item.status] || "#999999",
      legendFontColor: "#6d4226",
      legendFontSize: 12
    }));


  const lineChartData = {
    labels: statistics.monthlyData.length ? statistics.monthlyData.map(item => item.month) : [''],
    datasets: [
      {
        data: statistics.monthlyData.length ? statistics.monthlyData.map(item => item.count || 0) : [0]
      }
    ]
  };



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6d4226" />
            <Text style={styles.loadingText}>Loading statistics...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push("/adminOrdersScreen")}
              >
                <Text style={styles.statTitle}>Total Orders</Text>
                <Text style={styles.statValue}>{statistics.totalOrders}</Text>
                <Text style={styles.statLink}>View Orders →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push("/manageUsersScreen")}
              >
                <Text style={styles.statTitle}>Total Users</Text>
                <Text style={styles.statValue}>{statistics.totalUsers}</Text>
                <Text style={styles.statLink}>Manage Users →</Text>
              </TouchableOpacity>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Total Orders Price</Text>
                <Text style={styles.statValue}>${statistics.totalOrdersPrice.toFixed(2)}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Total Revenue</Text>
                <Text style={styles.statValue}>${statistics.totalRevenue.toFixed(2)}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Total Cost</Text>
                <Text style={styles.statValue}>${(statistics.totalOrdersPrice - statistics.totalRevenue).toFixed(2)}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Total Profit</Text>
                <Text style={styles.statValue}>${statistics.totalRevenue.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Order Status Distribution</Text>
              <PieChart
                data={pieChartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Monthly Orders</Text>
              <LineChart
                data={lineChartData}
                width={screenWidth - 65}
                height={220}
                chartConfig={chartConfig}
                bezier
                fromZero
                style={styles.chart}
              />
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Top Profitable Cakes</Text>
              {statistics.topProfitableCakes?.map((cake, index) => (
                <View key={index} style={styles.cakeItem}>
                  <Text style={styles.cakeName}>{cake.name}</Text>
                  <View style={styles.cakeStats}>
                    <Text style={styles.cakeStat}>Quantity: {cake.quantity}</Text>
                    <Text style={styles.cakeStat}>Profit: ${cake.profit.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdf6f0",
    marginBottom: 20
  },
  header: {
    padding: 20,
    backgroundColor: "#fdf6f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6d4226",
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    width: '31%',
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  statTitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  revenueValue: {
    fontSize: 18,
  },
  statLink: {
    fontSize: 12,
    color: "#6d4226",
    marginTop: 5,
    fontWeight: "500",
    backgroundColor: "#f9f3ea",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chartContainer: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6d4226",
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,

  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6d4226',
  },
  cakeItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cakeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6d4226',
    marginBottom: 4,
  },
  cakeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cakeStat: {
    fontSize: 14,
    color: '#666',
  },
});

export default StatisticsScreen;
