import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { LineChart, PieChart, BarChart } from "react-native-chart-kit";
import config from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import styles from "../styles/AdminScreensStyles/StatisticsScreenStyles";

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
    topProfitableCakes: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatistics();
    setRefreshing(false);
  };

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
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStatistics();
    }, [fetchStatistics])
  );

  const generateFinancialReport = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        Alert.alert("Error", "No access token found");
        return;
      }

      const response = await fetch(
        `${config.BASE_URL}/statistics/financial-report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Success",
          "Financial report has been sent to your email address.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to generate financial report"
        );
      }
    } catch (error) {
      console.error("Error generating financial report:", error);
      Alert.alert("Error", "Failed to generate financial report");
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    legendFontSize: 10,
    legendTextStyle: {
      marginRight: 10,
      maxWidth: 100,
    },
  };
  const statusColors: { [key: string]: string } = {
    delivered: "#4CAF50",
    pending: "#FFC107",
    cancelled: "#F44336",
  };

  const pieChartData = statistics.orderStatusData
    .filter((item) => typeof item.count === "number" && isFinite(item.count))
    .map((item) => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      population: item.count,
      color: statusColors[item.status] || "#999999",
      legendFontColor: "#6d4226",
      legendFontSize: 12,
    }));

  const lineChartData = {
    labels: statistics.monthlyData.length
      ? statistics.monthlyData.map((item) => item.month)
      : [""],
    datasets: [
      {
        data: statistics.monthlyData.length
          ? statistics.monthlyData.map((item) => item.count || 0)
          : [0],
      },
    ],
  };

  const predefinedColors = ["#A0522D", "#CD853F", "#D2691E"];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.title}>📊 Business Analytics</Text>
            
          </View>
        </View>
        <View style={{ alignItems: "center", marginVertical: 20 }}>
                      <TouchableOpacity
                        style={styles.reportButton}
                        onPress={generateFinancialReport}
                        disabled={isLoading}
                      >
                        <Text style={styles.reportButtonText}>📄 Generate Full Financial Report</Text>
                      </TouchableOpacity>
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
                onPress={() => router.push("/adminScreens/adminOrdersScreen")}
              >
                <Text style={styles.statTitle}>Total Orders</Text>
                <Text style={styles.statValue}>{statistics.totalOrders}</Text>
                <Text style={styles.statLink}>View Orders →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push("/adminScreens/manageUsersScreen")}
              >
                <Text style={styles.statTitle}>Total Users</Text>
                <Text style={styles.statValue}>{statistics.totalUsers}</Text>
                <Text style={styles.statLink}>Manage Users →</Text>
              </TouchableOpacity>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Total Orders Price</Text>
                <Text style={styles.statValue}>
                  ${statistics.totalOrdersPrice.toFixed(2)}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Total Revenue</Text>
                <Text style={styles.statValue}>
                  ${statistics.totalRevenue.toFixed(2)}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Total Cost</Text>
                <Text style={styles.statValue}>
                  $
                  {(
                    statistics.totalOrdersPrice - statistics.totalRevenue
                  ).toFixed(2)}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Total Profit</Text>
                <Text style={styles.statValue}>
                  ${statistics.totalRevenue.toFixed(2)}
                </Text>
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

              <Text style={styles.chartTitle}>Monthly Revenue</Text>
              <BarChart
                  data={{
                    labels: statistics.monthlyData.map((item) => item.month),
                    datasets: [
                      {
                        data: statistics.monthlyData.map((item) => typeof item.count === "number"
                          ? item.count * 10 // הנחה של הכפלה לייצוג רווח
                          : 0
                        ),
                      },
                    ],
                  }}
                  width={screenWidth - 65}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  fromZero
                  showValuesOnTopOfBars yAxisLabel={""} yAxisSuffix={""}              />
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: "#eee",
                marginHorizontal: 16,
                marginVertical: 8,
              }}
            />

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

            <View
              style={{
                height: 1,
                backgroundColor: "#eee",
                marginHorizontal: 16,
                marginVertical: 8,
              }}
            />

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Top Profitable Cakes</Text>
              {statistics.topProfitableCakes?.map((cake, index) => (
                <View key={index} style={styles.cakeItem}>
                  <Text style={styles.cakeName} numberOfLines={1} ellipsizeMode="tail">{cake.name}</Text>
                  <View style={styles.cakeStats}>
                    <Text style={styles.cakeStat}>
                      Quantity: {cake.quantity}
                    </Text>
                    <Text style={styles.cakeStat}>
                      Profit: ${cake.profit.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Top 3 Cakes (by Revenue)</Text>
              {statistics.topProfitableCakes.filter(c => c.revenue > 0).length >= 1 ? (
                <PieChart
                  data={statistics.topProfitableCakes
                    .filter(c => c.revenue > 0)
                    .slice(0, 3)
                    .map((cake, index) => ({
                      name: cake.name,
                      population: cake.revenue,
                      color: predefinedColors[index % predefinedColors.length],
                      legendFontColor: "#6d4226",
                      legendFontSize: 10,
                    }))}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="5"
                  absolute
                />
              ) : (
                <Text style={{ textAlign: "center", color: "#999" }}>
                  No data available for top 3 cakes.
                </Text>
              )}
            </View>

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};



export default StatisticsScreen;
